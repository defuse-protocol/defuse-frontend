import type { NextRequest } from "next/server"

import type {
  Pair,
  PairResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQuery } from "@src/clickhouse/clickhouse"

import { err, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { PAIR_SEPARATOR } from "../../shared/utils"

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
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return err("Bad Request", "Missing id parameter")
    }

    const parts = id.split(PAIR_SEPARATOR)
    if (parts.length < 2) {
      return err(
        "Bad Request",
        "Invalid pair ID format. Expected a composite key like asset0:asset1"
      )
    }
    const [asset0Id, asset1Id] = parts

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
