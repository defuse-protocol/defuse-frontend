import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  ApiResult,
  Event,
  EventsResponse,
} from "@src/app/api/integrations/shared/types"
import { chQuery } from "@src/clickhouse/clickhouse"

import { isErr, ok, tryCatch } from "../result"
import {
  PAIR_SEPARATOR,
  addDecimalPoint,
  calculatePriceWithMaxPrecision,
  validateQueryParams,
} from "../utils"

const querySchema = z.object({
  fromBlock: z.coerce.number(),
  toBlock: z.coerce.number(),
})

export const EVENTS_QUERY = `
WITH
  distinct_assets AS (
    SELECT DISTINCT defuse_asset_id, decimals
    FROM near_intents_db.defuse_assets
  ),

  inflows AS (
    SELECT
      token_id,
      block_height,
      sum(multiIf(memo = 'deposit', amount, 0)) - sum(multiIf(memo = 'withdraw', amount, 0)) AS inflow
    FROM near_intents_db.silver_nep_245_events
    WHERE memo IN ('deposit', 'withdraw')
      AND execution_status != 'failure'
      AND contract_id = 'intents.near'
      AND block_height <= { toBlock :UInt32 }
    GROUP BY token_id, block_height
  ),

reserves as (SELECT
  token_id,
  block_height,
  sum(inflow) over (partition by token_id order by block_height rows between unbounded preceding and current row) as balance
  FROM inflows),

swaps_and_inflows as (SELECT
  d.block_height,
  d.block_timestamp,
  d.tx_hash,
  d.intent_hash,
  d.receipt_index_in_block,
  d.index_in_log,
  d.account_id,
  d.token_in,
  d.token_out,
  d.amount_in,
  d.amount_out,
  asset_in.decimals AS decimals_in,
  asset_out.decimals AS decimals_out,
  NULL AS balance_in,
  NULL AS balance_out
FROM near_intents_db.silver_dip4_token_diff_new d
LEFT JOIN distinct_assets asset_in ON d.token_in = asset_in.defuse_asset_id
LEFT JOIN distinct_assets asset_out ON d.token_out = asset_out.defuse_asset_id
LEFT JOIN reserves reserves_in
  ON d.token_in = reserves_in.token_id AND d.block_height = reserves_in.block_height
LEFT JOIN reserves reserves_out
  ON d.token_out = reserves_out.token_id AND d.block_height = reserves_out.block_height
WHERE d.block_height >= { fromBlock :UInt32 }
  AND d.block_height <= { toBlock :UInt32 }

UNION ALL

SELECT
  r.block_height,
  NULL, NULL, NULL, NULL, NULL, NULL,
  r.token_id AS token_in,
  NULL AS token_out,
  NULL as amount_in,
  NULL as amount_out,
  asset_in.decimals AS decimals_in,
  NULL AS decimals_out,
  r.balance AS balance_in,
  NULL AS balance_out
FROM reserves r
LEFT JOIN distinct_assets asset_in ON r.token_id = asset_in.defuse_asset_id

UNION ALL

SELECT
  r.block_height,
  NULL, NULL, NULL, NULL, NULL, NULL,
  NULL AS token_in,
  r.token_id AS token_out,
  NULL as amount_in,
  NULL as amount_out,
  NULL AS decimals_in,
  asset_out.decimals AS decimals_out,
  NULL AS balance_in,
  r.balance AS balance_out
FROM reserves r
LEFT JOIN distinct_assets asset_out ON r.token_id = asset_out.defuse_asset_id
),

final as (SELECT
  d.block_height as block_height,
  block_timestamp,
  tx_hash,
  intent_hash,
  receipt_index_in_block,
  index_in_log,
  account_id,
  token_in,
  token_out,
  amount_in,
  amount_out,
  decimals_in,
  decimals_out,
  anyLast(balance_in) OVER (PARTITION BY token_in ORDER BY d.block_height ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance_in,
  anyLast(balance_out) OVER (PARTITION BY token_out ORDER BY d.block_height ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance_out
FROM swaps_and_inflows)

SELECT
  CAST(max(block_height) AS UInt32) AS blockNumber,
  toUnixTimestamp(max(block_timestamp)) AS blockTimestamp,
  tx_hash AS txnId,
  CAST(max(receipt_index_in_block) AS UInt32) AS txnIndex,
  CAST(max(index_in_log) AS UInt32) AS eventIndex,
  argMax(account_id, token_in IS NOT NULL) AS maker,
  argMax(token_in, token_in IS NOT NULL) AS tokenIn,
  argMax(token_out, token_out IS NOT NULL) AS tokenOut,
  printf(
    '%.0f',
    sumIf(abs(amount_in), amount_in IS NOT NULL)
  ) AS assetIn,
  printf(
    '%.0f',
    sumIf(amount_out, amount_out IS NOT NULL)
  ) AS assetOut,
  printf(
    '%.0f',
    sumIf(abs(balance_in), balance_in IS NOT NULL)
  ) AS reserveAssetIn,
  printf(
    '%.0f',
    sumIf(abs(balance_out), balance_out IS NOT NULL)
  ) AS reserveAssetOut,
  argMax(decimals_in, token_in IS NOT NULL) AS assetInDecimals,
  argMax(decimals_out, token_out IS NOT NULL) AS assetOutDecimals
FROM
  final
GROUP BY
  tx_hash,
  intent_hash
HAVING
  count(DISTINCT token_out) = 1
  AND count(DISTINCT token_in) = 1
  AND assetInDecimals != 0
  AND assetOutDecimals != 0
ORDER BY
  blockNumber ASC,
  txnIndex ASC,
  eventIndex ASC`

export interface RawEvent {
  blockNumber: number
  blockTimestamp: number
  txnId: string
  txnIndex: number
  eventIndex: number
  maker: string
  pairId: string
  assetIn: string
  assetOut: string
  reserveAssetIn: string
  reserveAssetOut: string
  assetInDecimals: number
  assetOutDecimals: number
  tokenIn: string
  tokenOut: string
}

/**
 * Fetches swap events within a specified block range.
 *
 * The `fromBlock` and `toBlock` parameters are both inclusive.
 *
 * @param request - The incoming Next.js request, containing the fromBlock and toBlock in the query parameters.
 * @returns A response containing a list of events.
 */
export const getEvents = tryCatch(
  async (request: NextRequest): ApiResult<EventsResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const rawEvents = await chQuery<
      Omit<RawEvent, "priceNative"> & {
        asset0Decimals: number
        asset1Decimals: number
      }
    >(EVENTS_QUERY, res.ok)

    const events = rawEvents.map((rawEvent): Event => {
      const tokenIn = rawEvent.tokenIn
      const tokenOut = rawEvent.tokenOut

      const assetIn = addDecimalPoint(
        rawEvent.assetIn,
        rawEvent.assetInDecimals
      )
      const assetOut = addDecimalPoint(
        rawEvent.assetOut,
        rawEvent.assetOutDecimals
      )
      const reserveAssetIn = addDecimalPoint(
        rawEvent.reserveAssetIn,
        rawEvent.assetInDecimals
      )
      const reserveAssetOut = addDecimalPoint(
        rawEvent.reserveAssetOut,
        rawEvent.assetOutDecimals
      )

      const common = {
        block: {
          blockNumber: rawEvent.blockNumber,
          blockTimestamp: rawEvent.blockTimestamp,
        },
        eventType: "swap",
        txnId: rawEvent.txnId,
        txnIndex: rawEvent.txnIndex,
        eventIndex: rawEvent.eventIndex,
        maker: rawEvent.maker,
      } as const

      if (tokenIn < tokenOut) {
        return {
          ...common,
          pairId: `${tokenIn}${PAIR_SEPARATOR}${tokenOut}`,
          asset0In: assetIn,
          asset1Out: assetOut,
          priceNative: calculatePriceWithMaxPrecision(
            rawEvent.assetIn,
            rawEvent.assetOut,
            rawEvent.assetInDecimals,
            rawEvent.assetOutDecimals
          ),
          reserves: {
            asset0: reserveAssetIn,
            asset1: reserveAssetOut,
          },
        }
      }

      return {
        ...common,
        pairId: `${tokenOut}${PAIR_SEPARATOR}${tokenIn}`,
        asset1In: assetIn,
        asset0Out: assetOut,
        priceNative: calculatePriceWithMaxPrecision(
          rawEvent.assetOut,
          rawEvent.assetIn,
          rawEvent.assetOutDecimals,
          rawEvent.assetInDecimals
        ),
        reserves: {
          asset0: reserveAssetOut,
          asset1: reserveAssetIn,
        },
      }
    })

    return ok({ events })
  }
)
