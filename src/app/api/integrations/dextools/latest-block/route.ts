import type { NextResponse } from "next/server"

import type { BlockResponse } from "@src/app/api/integrations/dextools/types"

import { getLatestBlock } from "../../shared/queries/latestBlock"
import type { ErrorResponse } from "../../shared/types"

// Disable caching for this route handler - only the inner data processing is cached
export const dynamic = "force-dynamic"
/**
 * Returns the most recent block that contains event data, which can be used
 * as a safe upper bound for `/events` queries.
 * test:
 * curl -X GET http://localhost:3000/api/integrations/dextools/latest-block -H "Authorization: Bearer <JWT_TOKEN>" -H "Content-Type: application/json"
 */
export async function GET(): Promise<
  NextResponse<BlockResponse | ErrorResponse>
> {
  return getLatestBlock()
}
