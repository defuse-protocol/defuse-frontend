import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, ok, tryCatch } from "../result"
import type { ApiResult, Block, LatestBlockResponse } from "../types"

import { EVENTS_QUERY } from "./events"

let latestBlock: number | null = null
const LATEST_KNOWN_BLOCK = 150810776

const LATEST_BLOCK_QUERY = `
WITH events AS (${EVENTS_QUERY})
SELECT
  CAST(MAX(blockNumber) AS UInt32) AS blockNumber,
  toUnixTimestamp(MAX(blockTimestamp)) AS blockTimestamp
FROM events`

/**
 * Fetches the latest block available for event data.
 *
 * This endpoint should be in sync with the /events endpoint, meaning it should
 * only return the latest block for which data from /events will be available.
 * It should not return a block for which /events has no data available yet.
 *
 * @returns A response containing the latest block information.
 */
export const getLatestBlock = tryCatch(
  async (): ApiResult<LatestBlockResponse> => {
    const block = await chQueryFirst<Block>(LATEST_BLOCK_QUERY, {
      fromBlock: latestBlock ?? LATEST_KNOWN_BLOCK,
      toBlock: Number.MAX_SAFE_INTEGER,
    })

    if (!block) {
      return err("Internal Server Error", "No block data available")
    }

    latestBlock = block.blockNumber
    return ok({ block })
  }
)
