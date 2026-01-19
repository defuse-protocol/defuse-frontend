import { logger } from "@src/utils/logger"

const INTENTS_EXPLORER_API_URL = "https://explorer.near-intents.org/api/v0"
const REQUEST_TIMEOUT_MS = 30_000

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
      pagination: {
        page: params.page ?? 1,
        perPage: params.perPage ?? 50,
        total: 0,
        hasMore: false,
      },
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

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`)
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
    clearTimeout(timeoutId)

    const isTimeout = error instanceof Error && error.name === "AbortError"
    const errorMessage = isTimeout
      ? "Request timed out"
      : error instanceof Error
        ? error.message
        : "Unknown error"

    logger.error("Failed to fetch from Intents Explorer API", {
      error: errorMessage,
    })

    throw new Error(errorMessage)
  }
}
