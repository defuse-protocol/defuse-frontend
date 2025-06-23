import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Pair,
  PairResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQuery } from "@src/clickhouse/clickhouse"

import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { PAIR_SEPARATOR, validateQueryParams } from "../../shared/utils"

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

    return { id, asset0Id, asset1Id }
  })
)

interface RawAsset {
  defuse_asset_id: string
}

const PAIR_ASSETS_QUERY = `
SELECT DISTINCT defuse_asset_id
FROM near_intents_db.defuse_assets
WHERE defuse_asset_id IN ({asset0Id:String}, {asset1Id:String})`

/**
 * Returns immutables for a pair / liquidity pool.
 * This implementation validates that both assets exist in the database.
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<PairResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const { id, asset0Id, asset1Id } = res.ok

    const assets = await chQuery<RawAsset>(PAIR_ASSETS_QUERY, {
      asset0Id,
      asset1Id,
    })

    if (assets.length !== 2) {
      return err("Not Found", "One or both assets for the pair not found")
    }

    const pair: Pair = {
      id,
      asset0Id,
      asset1Id,
      // Stubs: these fields are not available
      createdAtBlockNumber: 0,
      createdAtBlockTimestamp: 0,
      createdAtTxnId: "0x_stubbed_creation_txn_id",
      factoryAddress: "0x_stubbed_factory_address",
    }

    return ok({ pair })
  }
)
