import { type NextRequest, NextResponse } from "next/server"

import type {
  Pair,
  PairResponse,
} from "@src/app/api/integrations/gecko-terminal/types"
import { clickHouseClient } from "@src/clickhouse/clickhouse"

interface RawAsset {
  defuse_asset_id: string
}

const ASSETS_QUERY = `
SELECT defuse_asset_id
FROM near_intents_db.defuse_assets
WHERE defuse_asset_id IN ({asset0Id:String}, {asset1Id:String})
AND decimals != 0`

/**
 * Fetches information for a specific trading pair by its ID.
 *
 * All pair properties are immutable; the indexer will not query a given pair
 * more than once.
 *
 * The pair ID format is: {asset0Id}___{asset1Id}
 *
 * test:
 * http://localhost:3000/api/integrations/gecko-terminal/pair?id=nep141:17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1___nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near
 *
 * @param request - The incoming Next.js request, containing the pair ID in the query parameters.
 * @returns A response containing the pair's information.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PairResponse | { error: string }>> {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id parameter" }, { status: 400 })
  }

  const parts = id.split("___")
  if (parts.length !== 2) {
    return NextResponse.json(
      { error: "Invalid pair ID format. Expected: asset0___asset1" },
      { status: 400 }
    )
  }

  const [asset0Id, asset1Id] = parts

  const { data: assets } = await clickHouseClient
    .query({
      query: ASSETS_QUERY,
      query_params: {
        asset0Id,
        asset1Id,
      },
    })
    .then((res) => res.json<RawAsset>())

  if (assets.length < 2) {
    return NextResponse.json(
      { error: "One or both assets not found" },
      { status: 404 }
    )
  }

  const pair: Pair = {
    id,
    dexKey: "defuse",
    asset0Id,
    asset1Id,
  }

  return NextResponse.json({ pair })
}
