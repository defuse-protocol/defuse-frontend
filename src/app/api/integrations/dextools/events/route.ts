import type { NextRequest, NextResponse } from "next/server"

import type { EventsResponse } from "@src/app/api/integrations/dextools/types"

import { getEvents } from "../../shared/queries/events"
import type { ErrorResponse } from "../../shared/types"

/**
 * Returns a list of swap events that occurred between `fromBlock` and `toBlock`,
 * both inclusive, based on the DEXTools API spec
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<EventsResponse | ErrorResponse>> {
  return getEvents(request)
}
