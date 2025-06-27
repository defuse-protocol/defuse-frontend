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
WITH distinct_assets as (
  SELECT
    DISTINCT defuse_asset_id,
    decimals
  FROM
    near_intents_db.defuse_assets
)
SELECT
  CAST(max(d.block_height) AS UInt32) AS blockNumber,
  toUnixTimestamp(max(d.block_timestamp)) AS blockTimestamp,
  d.tx_hash AS txnId,
  CAST(max(d.receipt_index_in_block) AS UInt32) AS txnIndex,
  CAST(max(d.index_in_log) AS UInt32) AS eventIndex,
  argMax(d.account_id, d.token_in IS NOT NULL) AS maker,
  concat(
    argMax(d.token_in, d.token_in IS NOT NULL),
    '${PAIR_SEPARATOR}',
    argMax(d.token_out, d.token_out IS NOT NULL)
  ) AS pairId,
  printf(
    '%.0f',
    sumIf(abs(d.amount_in), d.amount_in IS NOT NULL)
  ) AS asset0In,
  printf(
    '%.0f',
    sumIf(d.amount_out, d.amount_out IS NOT NULL)
  ) AS asset1Out,
  printf(
    '%.0f',
    sumIf(abs(d.amount_in), d.amount_in IS NOT NULL)
  ) AS reserveAsset0,
  printf(
    '%.0f',
    sumIf(d.amount_out, d.amount_out IS NOT NULL)
  ) AS reserveAsset1,
  argMax(asset_in.decimals, d.token_in IS NOT NULL) AS asset0Decimals,
  argMax(asset_out.decimals, d.token_out IS NOT NULL) AS asset1Decimals
FROM
  near_intents_db.silver_dip4_token_diff_new d
  LEFT JOIN distinct_assets asset_in ON d.token_in = asset_in.defuse_asset_id
  LEFT JOIN distinct_assets asset_out ON d.token_out = asset_out.defuse_asset_id
WHERE
  d.tokens_cnt = 2
  AND d.tx_hash IS NOT NULL
  AND d.intent_hash IS NOT NULL
  AND d.block_height >= { fromBlock :UInt32 }
  AND d.block_height <= { toBlock :UInt32 }
GROUP BY
  d.tx_hash,
  d.intent_hash
HAVING
  count(DISTINCT d.token_out) = 1
  AND count(DISTINCT d.token_in) = 1
  -- TODO: Find decimals for everything then remove this filter
  AND asset0Decimals != 0
  AND asset1Decimals != 0
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
  asset0In: string
  asset1Out: string
  reserveAsset0: string
  reserveAsset1: string
  asset0Decimals: number
  asset1Decimals: number
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
      const asset0In = addDecimalPoint(
        rawEvent.asset0In,
        rawEvent.asset0Decimals
      )
      const asset1Out = addDecimalPoint(
        rawEvent.asset1Out,
        rawEvent.asset1Decimals
      )

      const priceNative = calculatePriceWithMaxPrecision(
        rawEvent.asset0In,
        rawEvent.asset1Out,
        rawEvent.asset0Decimals,
        rawEvent.asset1Decimals
      )

      return {
        block: {
          blockNumber: rawEvent.blockNumber,
          blockTimestamp: rawEvent.blockTimestamp,
        },
        eventType: "swap",
        txnId: rawEvent.txnId,
        txnIndex: rawEvent.txnIndex,
        eventIndex: rawEvent.eventIndex,
        maker: rawEvent.maker,
        pairId: rawEvent.pairId,
        asset0In,
        asset1Out,
        priceNative,
        reserves: {
          asset0: asset0In,
          asset1: asset1Out,
        },
      }
    })

    return ok({ events })
  }
)
