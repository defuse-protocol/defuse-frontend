import { and, desc, eq, gte, inArray, lte, or, sql } from "drizzle-orm"

import { quotes } from "@src/db/intents/schema"
import type { IntentsDb } from "@src/libs/intentsDb"

// Show completed, in-progress, and failed transactions
const VALID_STATUSES = [
  "SUCCESS",
  "PROCESSING",
  "PENDING_DEPOSIT",
  "REFUNDED",
  "FAILED",
] as const

export interface SwapHistoryFilters {
  accountId: string
  page: number
  limit: number
  startDate?: Date
  endDate?: Date
}

export interface SwapRecord {
  id: number
  originAsset: string
  destinationAsset: string
  recipient: string
  status: string
  createdAt: string
  intentHashes: string | null
  nearTxHashes: string | null
  depositAddress: string
  amountInFormatted: string
  amountOutFormatted: string
  amountInUsd: string
  amountOutUsd: string
}

export interface SwapHistoryResult {
  data: SwapRecord[]
  total: number
  hasMore: boolean
}

export function createSwapHistoryRepository(db: IntentsDb) {
  return {
    async findByAccount(
      filters: SwapHistoryFilters
    ): Promise<SwapHistoryResult> {
      const { accountId, page, limit, startDate, endDate } = filters
      const offset = (page - 1) * limit

      const conditions = [
        or(eq(quotes.recipient, accountId), eq(quotes.accountId, accountId)),
        inArray(quotes.status, [...VALID_STATUSES]),
      ]

      if (startDate) {
        conditions.push(gte(quotes.createdAt, startDate.toISOString()))
      }

      if (endDate) {
        conditions.push(lte(quotes.createdAt, endDate.toISOString()))
      }

      const whereClause = and(...conditions)

      const [data, countResult] = await Promise.all([
        db
          .select({
            id: quotes.id,
            originAsset: quotes.originAsset,
            destinationAsset: quotes.destinationAsset,
            recipient: quotes.recipient,
            status: quotes.status,
            createdAt: quotes.createdAt,
            intentHashes: quotes.intentHashes,
            nearTxHashes: quotes.nearTxHashes,
            depositAddress: quotes.depositAddress,
            amountInFormatted: quotes.amountInFormatted,
            amountOutFormatted: quotes.amountOutFormatted,
            amountInUsd: quotes.amountInUsd,
            amountOutUsd: quotes.amountOutUsd,
          })
          .from(quotes)
          .where(whereClause)
          .orderBy(desc(quotes.createdAt))
          .limit(limit)
          .offset(offset),

        db
          .select({ count: sql<number>`count(*)` })
          .from(quotes)
          .where(whereClause),
      ])

      const total = countResult[0]?.count ?? 0
      const hasMore = offset + data.length < total

      return { data, total, hasMore }
    },
  }
}

export type SwapHistoryRepository = ReturnType<
  typeof createSwapHistoryRepository
>
