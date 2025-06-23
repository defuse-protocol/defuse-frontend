import type { NextRequest } from "next/server"
import { z } from "zod"

import type {
  Block,
  BlockResponse,
} from "@src/app/api/integrations/dextools/types"
import { chQueryFirst } from "@src/clickhouse/clickhouse"

import { err, isErr, ok, tryCatch } from "../../shared/result"
import type { ApiResult } from "../../shared/types"
import { validateQueryParams } from "../../shared/utils"

const numberSchema = z.object({ number: z.coerce.number() })
const timestampSchema = z.object({ timestamp: z.coerce.number() })
const bothSchema = numberSchema.merge(timestampSchema)
const querySchema = z.union([numberSchema, timestampSchema, bothSchema])

const BLOCK_BY_NUMBER_QUERY = `
SELECT
  CAST(block_height AS UInt32) AS blockNumber,
  toUnixTimestamp(block_timestamp) AS blockTimestamp
FROM near_intents_db.silver_dip4_token_diff_new
WHERE block_height = {blockNumber:UInt32}
LIMIT 1`

const BLOCK_BY_TIMESTAMP_QUERY = `
SELECT
  CAST(block_height AS UInt32) AS blockNumber,
  toUnixTimestamp(block_timestamp) AS blockTimestamp
FROM near_intents_db.silver_dip4_token_diff_new
ORDER BY abs(toUnixTimestamp(block_timestamp) - {timestamp:UInt64})
LIMIT 1`

/**
 * Returns a block either by number (takes precedence) or by timestamp,
 * sourcing data from the main events table.
 */
export const GET = tryCatch(
  async (request: NextRequest): ApiResult<BlockResponse> => {
    const res = validateQueryParams(request, querySchema)

    if (isErr(res)) {
      return res
    }

    const block =
      "number" in res.ok
        ? await chQueryFirst<Block>(BLOCK_BY_NUMBER_QUERY, {
            blockNumber: res.ok.number,
          })
        : await chQueryFirst<Block>(BLOCK_BY_TIMESTAMP_QUERY, {
            timestamp: res.ok.timestamp,
          })

    if (!block) {
      return err("Not Found", "Block not found")
    }

    return ok({ block })
  }
)
