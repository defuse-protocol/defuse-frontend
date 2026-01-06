import {
  createSwapHistoryRepository,
  transformSwapRecord,
} from "@src/features/balance-history/repository"
import type {
  ErrorResponse,
  SwapHistoryResponse,
  SwapTransaction,
} from "@src/features/balance-history/types"
import { intentsDb } from "@src/libs/intentsDb"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import * as v from "valibot"

const DEFAULT_PAGE = 1
const DEFAULT_LIMIT = 50
const MAX_LIMIT = 100

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
  startDate: v.optional(v.string()),
  endDate: v.optional(v.string()),
})

type QueryParams = v.InferOutput<typeof queryParamsSchema>

function createResponse(
  data: SwapTransaction[],
  pagination: SwapHistoryResponse["pagination"]
): NextResponse<SwapHistoryResponse> {
  return NextResponse.json({ data, pagination })
}

function emptyResponse(
  page: number,
  limit: number
): NextResponse<SwapHistoryResponse> {
  return createResponse([], { page, limit, total: 0, hasMore: false })
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
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
    })
  } catch {
    return null
  }
}

function parseDateFilter(dateString: string | undefined): Date | undefined {
  if (!dateString) return undefined

  const parsed = new Date(dateString)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params

  if (!accountId) {
    return errorResponse("Account ID is required", 400)
  }

  if (!intentsDb) {
    logger.warn("Balance history: INTENTS_DB_URL not configured")
    return emptyResponse(DEFAULT_PAGE, DEFAULT_LIMIT)
  }

  const { searchParams } = new URL(request.url)
  const queryParams = parseQueryParams(searchParams)

  if (!queryParams) {
    return errorResponse("Invalid query parameters", 400)
  }

  const { page, limit, startDate, endDate } = queryParams

  try {
    const repository = createSwapHistoryRepository(intentsDb)

    const result = await repository.findByAccount({
      accountId,
      page: Number(page),
      limit: Number(limit),
      startDate: parseDateFilter(startDate),
      endDate: parseDateFilter(endDate),
    })

    const swaps = result.data.map(transformSwapRecord)

    return createResponse(swaps, {
      page: Number(page),
      limit: Number(limit),
      total: result.total,
      hasMore: result.hasMore,
    })
  } catch (err) {
    logger.error("Balance history query failed", {
      error: err instanceof Error ? err.message : "Unknown error",
    })
    return errorResponse("Failed to load swap history", 500)
  }
}
