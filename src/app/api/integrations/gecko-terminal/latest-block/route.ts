import type { NextResponse } from "next/server"

import type { LatestBlockResponse } from "@src/app/api/integrations/gecko-terminal/types"

import { getLatestBlock } from "../../shared/queries/latestBlock"
import type { ErrorResponse } from "../../shared/types"

/**
 * Fetches the latest block available for event data.
 *
 * This endpoint should be in sync with the /events endpoint, meaning it should
 * only return the latest block for which data from /events will be available.
 * It should not return a block for which /events has no data available yet.
 *
 * test:
 * http://localhost:3000/api/integrations/gecko-terminal/latest-block
 *
 * @returns A response containing the latest block information.
 */
export async function GET(): Promise<
  NextResponse<LatestBlockResponse | ErrorResponse>
> {
  return getLatestBlock()
}
