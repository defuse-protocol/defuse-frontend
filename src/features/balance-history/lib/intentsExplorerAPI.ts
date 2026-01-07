import { logger } from "@src/utils/logger"

const INTENTS_EXPLORER_API_URL = "https://explorer.near-intents.org/api/v0"

export interface IntentsExplorerTransaction {
  originAsset: string
  destinationAsset: string
  depositAddress: string
  depositAddressAndMemo: string
  recipient: string
  status:
    | "SUCCESS"
    | "FAILED"
    | "INCOMPLETE_DEPOSIT"
    | "PENDING_DEPOSIT"
    | "PROCESSING"
    | "REFUNDED"
  createdAt: string
  createdAtTimestamp: number
  intentHashes: string | null
  referral: string | null
  amountInFormatted: string
  amountOutFormatted: string
  amountIn: string
  amountInUsd: string
  amountOut: string
  amountOutUsd: string
  refundTo: string
  senders: string[]
  nearTxHashes: string[]
  originChainTxHashes: string[]
  destinationChainTxHashes: string[]
  appFees: Array<{ recipient: string; amount: string }>
  refundReason: string | null
}

export interface IntentsExplorerParams {
  recipient: string
  page?: number
  perPage?: number
  statuses?: string
}

export interface IntentsExplorerResponse {
  data: IntentsExplorerTransaction[]
  pagination: {
    page: number
    perPage: number
    total: number
    hasMore: boolean
  }
}

function getApiKey(): string | null {
  return process.env.INTENTS_EXPLORER_API_KEY ?? null
}

export async function fetchIntentsExplorerTransactions(
  params: IntentsExplorerParams
): Promise<IntentsExplorerResponse> {
  const apiKey = getApiKey()

  if (!apiKey) {
    logger.warn("INTENTS_EXPLORER_API_KEY not configured")
    return {
      data: [],
      pagination: { page: 1, perPage: 50, total: 0, hasMore: false },
    }
  }

  const { recipient, page = 1, perPage = 50, statuses } = params

  const searchParams = new URLSearchParams({
    search: recipient,
    page: String(page),
    perPage: String(perPage),
  })

  if (statuses) {
    searchParams.set("statuses", statuses)
  }

  const url = `${INTENTS_EXPLORER_API_URL}/transactions-pages?${searchParams}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 0 },
    })

    if (!response.ok) {
      logger.error("Intents Explorer API error", {
        status: response.status,
        statusText: response.statusText,
      })
      return {
        data: [],
        pagination: { page, perPage, total: 0, hasMore: false },
      }
    }

    const json = (await response.json()) as {
      data: IntentsExplorerTransaction[]
      page: number
      perPage: number
      total: number
      totalPages: number
    }

    return {
      data: json.data,
      pagination: {
        page: json.page,
        perPage: json.perPage,
        total: json.total,
        hasMore: json.page < json.totalPages,
      },
    }
  } catch (error) {
    logger.error("Failed to fetch from Intents Explorer API", {
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return {
      data: [],
      pagination: { page, perPage, total: 0, hasMore: false },
    }
  }
}
