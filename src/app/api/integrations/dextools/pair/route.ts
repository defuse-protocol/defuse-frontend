import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Pair,
  PairResponse,
} from "@src/app/api/integrations/dextools/types"
import { EVENTS_QUERY } from "@src/app/api/integrations/shared/queries/events"
import {
  PAIR_SEPARATOR,
  defuseAssetIdToGeckoId,
  validateQueryParams,
} from "@src/app/api/integrations/shared/utils"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { CONTRACT_ADDRESS } from "../../shared/constants"
import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"

const querySchema = z.object({ id: z.string() }).pipe(
  z.object({ id: z.string() }).transform(({ id }, ctx) => {
    const [asset0Id, asset1Id, ...rest] = id.split(PAIR_SEPARATOR)

    if (asset0Id === undefined || asset1Id === undefined || rest.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid pair ID format. Expected a composite key like asset0${PAIR_SEPARATOR}asset1`,
      })

      return z.NEVER
    }

    if (asset0Id >= asset1Id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Invalid pair ID format. Expected asset ids to be sorted in ascending order",
      })

      return z.NEVER
    }

    return { id, asset0Id, asset1Id }
  })
)

const PAIR_ASSETS_QUERY = `
WITH events AS (${EVENTS_QUERY})
SELECT
  blockNumber AS createdAtBlockNumber,
  blockTimestamp AS createdAtBlockTimestamp,
  txnId AS createdAtTxnId
FROM events
WHERE pairId = concat({asset0Id:String}, '${PAIR_SEPARATOR}', {asset1Id:String})
ORDER BY blockNumber ASC, txnIndex ASC, eventIndex ASC
LIMIT 1`

/**
 * Returns immutables for a pair / liquidity pool.
 * This implementation validates that both assets exist in the database.
 * test:
 * http://localhost:3000/api/integrations/dextools/pair?id=nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1___nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<PairResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const { id, asset0Id, asset1Id } = res.ok

    const pairInfo = await chQueryFirst<
      Pick<
        Pair,
        "createdAtBlockNumber" | "createdAtBlockTimestamp" | "createdAtTxnId"
      >
    >(PAIR_ASSETS_QUERY, {
      asset0Id,
      asset1Id,
      fromBlock: 0,
      toBlock: Number.MAX_SAFE_INTEGER,
    })

    if (!pairInfo) {
      return err("Not Found", "Pair not found")
    }

    const geckoId0 = defuseAssetIdToGeckoId(asset0Id)

    if (isErr(geckoId0)) {
      return geckoId0
    }

    const geckoId1 = defuseAssetIdToGeckoId(asset1Id)

    if (isErr(geckoId1)) {
      return geckoId1
    }

    const pair: Pair = {
      id,
      asset0Id: geckoId0.ok,
      asset1Id: geckoId1.ok,
      // NOTE: we use first time the pair was traded as the creation time
      ...pairInfo,
      factoryAddress: CONTRACT_ADDRESS,
    }

    return ok({ pair })
  }
)
