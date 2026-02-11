import {
  type IntentsExplorerTransaction,
  fetchIntentsExplorerTransactions,
} from "@src/features/balance-history/lib/intentsExplorerAPI"
import { transformTransaction } from "@src/features/balance-history/lib/transformTransaction"
import type {
  ErrorResponse,
  SwapHistoryResponse,
  SwapTransaction,
} from "@src/features/balance-history/types"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import * as v from "valibot"

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100
const STALE_TRANSACTION_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24 hours

const ALL_STATUSES: IntentsExplorerTransaction["status"][] = [
  "SUCCESS",
  "PROCESSING",
  "INCOMPLETE_DEPOSIT",
  "REFUNDED",
  "FAILED",
]

const STALE_STATUSES: IntentsExplorerTransaction["status"][] = [
  "FAILED",
  "REFUNDED",
  "PENDING_DEPOSIT",
  "INCOMPLETE_DEPOSIT",
]

function isStaleTransaction(tx: IntentsExplorerTransaction): boolean {
  if (!STALE_STATUSES.includes(tx.status)) {
    return false
  }
  const txAgeMs = Date.now() - tx.createdAtTimestamp * 1000
  return txAgeMs > STALE_TRANSACTION_THRESHOLD_MS
}

const queryParamsSchema = v.object({
  page: v.optional(
    v.pipe(v.string(), v.transform(Number), v.number(), v.minValue(1)),
    String(DEFAULT_PAGE)
  ),
  limit: v.optional(
    v.pipe(
      v.string(),
      v.transform(Number),
      v.number(),
      v.minValue(1),
      v.maxValue(MAX_LIMIT)
    ),
    String(DEFAULT_LIMIT)
  ),
})

type QueryParams = v.InferOutput<typeof queryParamsSchema>

function createResponse(
  data: SwapTransaction[],
  pagination: SwapHistoryResponse["pagination"]
): NextResponse<SwapHistoryResponse> {
  return NextResponse.json({ data, pagination })
}

function errorResponse(
  message: string,
  status: number
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message }, { status })
}

function parseQueryParams(searchParams: URLSearchParams): QueryParams | null {
  try {
    return v.parse(queryParamsSchema, {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
    })
  } catch {
    return null
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params

  if (!accountId) {
    return errorResponse("Account ID is required", 400)
  }

  const { searchParams } = new URL(request.url)
  const queryParams = parseQueryParams(searchParams)

  if (!queryParams) {
    return errorResponse("Invalid query parameters", 400)
  }

  const { page, limit } = queryParams

  try {
    const result = await fetchIntentsExplorerTransactions({
      recipient: accountId,
      page: Number(page),
      perPage: Number(limit),
      statuses: ALL_STATUSES.join(","),
    })

    const filteredData = result.data.filter((tx) => !isStaleTransaction(tx))
    const swaps = filteredData.map(transformTransaction)

    return createResponse(swaps, {
      page: result.pagination.page,
      limit: result.pagination.perPage,
      total: result.pagination.total,
      hasMore: result.pagination.hasMore,
    })
  } catch (err) {
    logger.error("Balance history query failed", {
      error: err instanceof Error ? err.message : "Unknown error",
    })
    return errorResponse("Failed to load swap history", 500)
  }
}
