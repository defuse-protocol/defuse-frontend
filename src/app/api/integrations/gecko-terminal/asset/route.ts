import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Asset,
  AssetResponse,
} from "@src/app/api/integrations/gecko-terminal/types"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { geckoIdToDefuseAssetId, validateQueryParams } from "../../shared/utils"

const querySchema = z.object({ id: z.string() })

interface RawAsset {
  id: string
  name: string
  symbol: string
  decimals: number
  blockchain: string
  contract_address: string
}

const ASSET_QUERY = `
SELECT
  defuse_asset_id AS id,
  defuse_asset_id AS name,
  symbol,
  CAST(decimals AS UInt32) AS decimals,
  blockchain,
  contract_address
FROM near_intents_db.defuse_assets
WHERE defuse_asset_id = {id:String} AND contract_address != ''
ORDER BY price_updated_at DESC
LIMIT 1`

/**
 * Fetches information for a specific asset by its ID.
 *
 * All asset properties aside from `id` may be mutable. The indexer will
 * periodically query assets for their most up-to-date information.
 *
 * test for nep141:
 * curl -X GET http://localhost:3000/api/integrations/gecko-terminal/asset?id=17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1 -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json"
 *
 * test for nep245:
 * curl -X GET http://localhost:3000/api/integrations/gecko-terminal/asset?id=nep245:v2_1.omni.hot.tg:10_11111111111111111111 -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json"
 *
 * @param request - The incoming Next.js request, containing the asset ID in the query parameters.
 * @returns A response containing the asset's information.
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const geckoId = res.ok.id
    const defuseAssetId = geckoIdToDefuseAssetId(geckoId)

    if (isErr(defuseAssetId)) {
      return defuseAssetId
    }

    const rawAsset = await chQueryFirst<RawAsset>(ASSET_QUERY, {
      id: defuseAssetId.ok,
    })

    if (!rawAsset) {
      return err("Not Found", "Asset not found")
    }

    const asset: Asset = {
      id: geckoId,
      name: rawAsset.name,
      symbol: rawAsset.symbol,
      decimals: rawAsset.decimals,
      metadata: {
        blockchain: rawAsset.blockchain,
        contract_address: rawAsset.contract_address,
      },
    }

    return ok({ asset })
  }
)
