import type { NextRequest } from "next/server"
import { z } from "zod"

import { CONTRACT_ADDRESS } from "@src/app/api/integrations/shared/constants"
import {
  PAIR_SEPARATOR,
  defuseAssetIdToGeckoId,
  validateQueryParams,
} from "@src/app/api/integrations/shared/utils"
import { clickHouseClient } from "@src/clickhouse/clickhouse"

import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import type { PairResponse } from "../types"

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

interface RawAsset {
  defuse_asset_id: string
}

const ASSETS_QUERY = `
SELECT DISTINCT defuse_asset_id
FROM near_intents_db.defuse_assets
WHERE defuse_asset_id IN ({asset0Id:String}, {asset1Id:String})`

/**
 * Fetches information for a specific trading pair by its ID.
 *
 * All pair properties are immutable; the indexer will not query a given pair
 * more than once.
 *
 * The pair ID format is: {asset0Id}___{asset1Id}
 *
 * test:
 * curl -X GET http://localhost:3000/api/integrations/gecko-terminal/pair?id=nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1___nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json"
 *
 * @param request - The incoming Next.js request, containing the pair ID in the query parameters.
 * @returns A response containing the pair's information.
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<PairResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const { id, asset0Id, asset1Id } = res.ok

    const { data: assets } = await clickHouseClient
      .query({
        query: ASSETS_QUERY,
        query_params: { asset0Id, asset1Id },
      })
      .then((res) => res.json<RawAsset>())

    if (assets.length !== 2) {
      return err("Not Found", "One or both assets not found")
    }

    const geckoId0 = defuseAssetIdToGeckoId(asset0Id)

    if (isErr(geckoId0)) {
      return geckoId0
    }

    const geckoId1 = defuseAssetIdToGeckoId(asset1Id)

    if (isErr(geckoId1)) {
      return geckoId1
    }

    return ok({
      pair: {
        id,
        dexKey: CONTRACT_ADDRESS,
        asset0Id: geckoId0.ok,
        asset1Id: geckoId1.ok,
      },
    })
  }
)
