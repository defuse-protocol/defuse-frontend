import type { NextRequest } from "next/server"

import type {
  Block,
  BlockResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"

const BLOCK_BY_NUMBER_QUERY = `
SELECT
  block_height AS blockNumber,
  toUnixTimestamp(block_timestamp) AS blockTimestamp
FROM near_intents_db.silver_dip4_token_diff_new
WHERE block_height = {blockNumber:UInt64}
LIMIT 1`

const BLOCK_BY_TIMESTAMP_QUERY = `
SELECT
  block_height AS blockNumber,
  toUnixTimestamp(block_timestamp) AS blockTimestamp
FROM near_intents_db.silver_dip4_token_diff_new
WHERE block_timestamp <= toDateTime({timestamp:UInt64})
ORDER BY block_timestamp DESC
LIMIT 1`

/**
 * Returns a block either by number (takes precedence) or by timestamp,
 * sourcing data from the main events table.
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<BlockResponse> => {
    const { searchParams } = new URL(request.url)

    const numberParam = searchParams.get("number")
    const timestampParam = searchParams.get("timestamp")

    if (!numberParam && !timestampParam) {
      return err(
        "Bad Request",
        "Either number or timestamp query parameter must be supplied"
      )
    }

    let block: Block | undefined

    if (numberParam) {
      block = await chQueryFirst<Block>(BLOCK_BY_NUMBER_QUERY, {
        blockNumber: Number.parseInt(numberParam),
      })
    } else {
      // timestampParam is non-null here due to the check above
      const timestamp = Number.parseInt(timestampParam as string)
      block = await chQueryFirst<Block>(BLOCK_BY_TIMESTAMP_QUERY, {
        timestamp,
      })
    }

    if (!block) {
      return err("Not Found", "Block not found")
    }

    return ok({ block })
  }
)
