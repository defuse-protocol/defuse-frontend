import type { NextRequest } from "next/server"

import type {
  Asset,
  AssetResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"

const ASSET_QUERY = `
SELECT
  defuse_asset_id AS id,
  symbol
FROM near_intents_db.defuse_assets
WHERE defuse_asset_id = {assetId:String}
ORDER BY price_updated_at DESC
LIMIT 1`

/**
 * Returns metadata for a single asset
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetResponse> => {
    const { searchParams } = new URL(request.url)
    const assetId = searchParams.get("id")

    if (!assetId) {
      return err("Bad Request", "Missing id parameter")
    }

    const asset = await chQueryFirst<Omit<Asset, "metadata">>(ASSET_QUERY, {
      assetId,
    })

    if (!asset) {
      return err("Not Found", "Asset not found")
    }

    return ok({ asset })
  }
)
