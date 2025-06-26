import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Asset,
  AssetResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { validateQueryParams } from "../../shared/utils"

const querySchema = z.object({ id: z.string() })

const ASSET_QUERY = `
WITH assetHolders AS (
  SELECT
    1
  FROM
    near_intents_db.token_holders_checkpoints
  WHERE
    asset_id = {id:String}
  GROUP BY
    account_id,
    asset_id
  HAVING
    SUM(balance) > 0
)
SELECT
  defuse_asset_id AS id,
  symbol,
  (
    SELECT
      toUInt32(count())
    FROM
      assetHolders
  ) AS holdersCount
FROM
  near_intents_db.defuse_assets
WHERE
  defuse_asset_id = {id:String}
ORDER BY
  price_updated_at DESC
LIMIT 1`

/**
 * Returns metadata for a single asset
 * test:
 * http://localhost:3000/api/integrations/dextools/asset?id=nep141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const asset = await chQueryFirst<Asset>(ASSET_QUERY, res.ok)

    if (!asset) {
      return err("Not Found", "Asset not found")
    }

    return ok({ asset })
  }
)
