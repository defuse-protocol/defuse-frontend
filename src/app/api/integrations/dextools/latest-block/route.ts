import type { NextResponse } from "next/server"

import type { BlockResponse } from "@src/app/api/integrations/dextools/types"

import { getLatestBlock } from "../../shared/queries/latestBlock"
import type { ErrorResponse } from "../../shared/types"

/**
 * Returns the most recent block that contains event data, which can be used
 * as a safe upper bound for `/events` queries.
 * test:
 * http://localhost:3000/api/integrations/dextools/latest-block
 */
export async function GET(): Promise<
  NextResponse<BlockResponse | ErrorResponse>
> {
  return getLatestBlock()
}
