import { NextResponse } from "next/server"

import type {
  Block,
  LatestBlockResponse,
} from "@src/app/api/integrations/gecko-terminal/types"
import { clickHouseClient } from "@src/clickhouse/clickhouse"

import { EVENTS_QUERY } from "../events/route"

let latestBlock: number | null = null

const LATEST_BLOCK_QUERY = `
WITH events AS (
  ${EVENTS_QUERY}
)
SELECT
  CAST(MAX(blockNumber) AS UInt32) AS blockNumber,
  toUnixTimestamp(MAX(blockTimestamp)) AS blockTimestamp
FROM events`

const LATEST_KNOWN_BLOCK = 150810776

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
export async function GET(): Promise<NextResponse<LatestBlockResponse>> {
  const {
    data: [block],
  } = await clickHouseClient
    .query({
      query: LATEST_BLOCK_QUERY,
      query_params: {
        fromBlock: latestBlock ?? LATEST_KNOWN_BLOCK,
        toBlock: Number.MAX_SAFE_INTEGER,
      },
    })
    .then((res) => res.json<Block>())

  latestBlock = block.blockNumber
  return NextResponse.json({ block })
}
