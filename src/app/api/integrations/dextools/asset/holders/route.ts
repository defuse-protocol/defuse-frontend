import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  AssetHolder,
  AssetHoldersResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQuery } from "@src/clickhouse/clickhouse"

import { isErr, ok, tryCatch } from "../../../shared/result"
import type { ApiResult } from "../../../shared/types"
import {
  geckoIdToDefuseAssetId,
  validateQueryParams,
} from "../../../shared/utils"

const querySchema = z.object({
  id: z.string(),
  page: z.coerce.number().optional().default(1),
  pageSize: z.coerce.number().optional().default(20),
})

const HOLDER_QUERY = `
WITH assetHolders AS (
  SELECT
    account_id as address,
    SUM(balance) AS quantity
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
  *,
  (
    SELECT
      COUNT()
    FROM
      assetHolders
  ) AS totalHoldersCount
FROM
  assetHolders
ORDER BY
  quantity DESC
LIMIT {pageSize:UInt64}
OFFSET {offset:UInt64}
`

/**
 * Returns a paginated list of the largest token holders.
 * test:
 * curl -X GET http://localhost:3000/api/integrations/dextools/asset/holders?id=NEP-141:base-0x833589fcd6edb6e08f4c7c32d4f71b54bda02913.omft.near&page=1&pageSize=10 -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json"
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<AssetHoldersResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const { id: geckoId, page, pageSize } = res.ok

    const defuseAssetId = geckoIdToDefuseAssetId(geckoId)

    if (isErr(defuseAssetId)) {
      return defuseAssetId
    }

    const id = defuseAssetId.ok

    const offset = (page - 1) * pageSize

    const holdersData = await chQuery<
      AssetHolder & { totalHoldersCount: number }
    >(HOLDER_QUERY, { id, pageSize, offset })

    const [first] = holdersData

    if (first === undefined) {
      return ok({ asset: { id: geckoId, totalHoldersCount: 0, holders: [] } })
    }

    const { totalHoldersCount } = first
    const holders = holdersData.map(
      ({ totalHoldersCount: _, ...rest }): AssetHolder => rest
    )

    return ok({ asset: { id: geckoId, totalHoldersCount, holders } })
  }
)
