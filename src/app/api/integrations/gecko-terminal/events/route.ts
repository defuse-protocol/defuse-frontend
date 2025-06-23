import type { NextRequest, NextResponse } from "next/server"

import { getEvents } from "../../shared/queries/events"
import type { ErrorResponse } from "../../shared/types"
import type { EventsResponse } from "../types"

/**
 * Fetches swap events within a specified block range.
 *
 * The `fromBlock` and `toBlock` parameters are both inclusive.
 *
 * test:
 * http://localhost:3000/api/integrations/gecko-terminal/events?fromBlock=150777201&toBlock=150777222
 *
 * @param request - The incoming Next.js request, containing the fromBlock and toBlock in the query parameters.
 * @returns A response containing a list of events.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<EventsResponse | ErrorResponse>> {
  return getEvents(request)
}
