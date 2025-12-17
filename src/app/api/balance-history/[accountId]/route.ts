import type {
  BalanceChange,
  BalanceHistoryResponse,
  ErrorResponse,
} from "@src/features/balance-history/types"
import { chQuery } from "@src/utils/clickhouse"
import { CLICK_HOUSE_URL } from "@src/utils/environment"
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
  tokenId: v.optional(v.string()),
  changeType: v.optional(
    v.picklist([
      "deposit",
      "withdrawal",
      "swap_in",
      "swap_out",
      "transfer_in",
      "transfer_out",
    ])
  ),
})

export async function GET(
  request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) {
  const { accountId } = await params

  if (!accountId) {
    return NextResponse.json(
      { error: "Account ID is required" } satisfies ErrorResponse,
      { status: 400 }
    )
  }

  // Return empty data if ClickHouse is not configured (graceful degradation)
  if (!CLICK_HOUSE_URL) {
    logger.warn("Balance history: ClickHouse not configured")
    return NextResponse.json({
      data: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        hasMore: false,
      },
    } satisfies BalanceHistoryResponse)
  }

  const { searchParams } = new URL(request.url)

  let validatedParams: v.InferOutput<typeof queryParamsSchema>
  try {
    validatedParams = v.parse(queryParamsSchema, {
      page: searchParams.get("page") ?? undefined,
      limit: searchParams.get("limit") ?? undefined,
      startDate: searchParams.get("startDate") ?? undefined,
      endDate: searchParams.get("endDate") ?? undefined,
      tokenId: searchParams.get("tokenId") ?? undefined,
      changeType: searchParams.get("changeType") ?? undefined,
    })
  } catch (err) {
    logger.error(err)
    return NextResponse.json(
      { error: "Invalid query parameters" } satisfies ErrorResponse,
      { status: 400 }
    )
  }

  const { page, limit, startDate, endDate, tokenId, changeType } =
    validatedParams
  const offset = (Number(page) - 1) * Number(limit)

  const whereConditions = ["account_id = {accountId:String}"]

  if (startDate) {
    whereConditions.push("block_timestamp >= {startDate:DateTime}")
  }
  if (endDate) {
    whereConditions.push("block_timestamp <= {endDate:DateTime}")
  }
  if (tokenId) {
    whereConditions.push("token_id = {tokenId:String}")
  }
  if (changeType) {
    whereConditions.push("change_type = {changeType:String}")
  }

  const whereClause = whereConditions.join(" AND ")

  const countQuery = `
    SELECT count() as total
    FROM near_intents_metrics.balance_changes
    WHERE ${whereClause}
  `

  const dataQuery = `
    SELECT
      block_timestamp,
      transaction_hash,
      account_id,
      token_id,
      symbol,
      blockchain,
      amount,
      amount_usd,
      balance_before,
      balance_after,
      change_type
    FROM near_intents_metrics.balance_changes
    WHERE ${whereClause}
    ORDER BY block_timestamp DESC
    LIMIT {limit:UInt32}
    OFFSET {offset:UInt32}
  `

  const queryParams = {
    accountId,
    limit: Number(limit),
    offset,
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
    ...(tokenId && { tokenId }),
    ...(changeType && { changeType }),
  }

  try {
    const [countResult, dataResult] = await Promise.all([
      chQuery<{ total: number }>(countQuery, queryParams),
      chQuery<BalanceChange>(dataQuery, queryParams),
    ])

    const total = countResult[0]?.total ?? 0
    const hasMore = offset + Number(limit) < total

    return NextResponse.json({
      data: dataResult,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        hasMore,
      },
    } satisfies BalanceHistoryResponse)
  } catch (err) {
    // Log the error but return empty data for graceful degradation
    // This handles cases like: table doesn't exist, connection issues, etc.
    logger.error(
      err instanceof Error ? err.message : "Balance history query failed"
    )

    // Return empty data instead of error for better UX
    return NextResponse.json({
      data: [],
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: 0,
        hasMore: false,
      },
    } satisfies BalanceHistoryResponse)
  }
}
