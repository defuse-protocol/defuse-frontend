import type { NextResponse } from "next/server"

import type { BlockResponse } from "@src/app/api/integrations/dextools/types"

import { getLatestBlock } from "../../shared/queries/latestBlock"
import type { ErrorResponse } from "../../shared/types"

/**
 * Returns the most recent block that contains event data, which can be used
 * as a safe upper bound for `/events` queries.
 */
export async function GET(): Promise<
  NextResponse<BlockResponse | ErrorResponse>
> {
  return getLatestBlock()
}
