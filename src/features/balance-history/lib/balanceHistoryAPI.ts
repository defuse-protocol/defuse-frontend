import type {
  SwapHistoryParams,
  SwapHistoryResponse,
} from "@src/features/balance-history/types"
import { BASE_URL } from "@src/utils/environment"

const REQUEST_TIMEOUT_MS = 30_000

export async function fetchSwapHistory(
  params: SwapHistoryParams
): Promise<SwapHistoryResponse> {
  const { accountId, page, limit } = params

  const searchParams = new URLSearchParams()
  if (page) searchParams.set("page", String(page))
  if (limit) searchParams.set("limit", String(limit))

  const queryString = searchParams.toString()
  const url = `${BASE_URL}/api/balance-history/${encodeURIComponent(accountId)}${queryString ? `?${queryString}` : ""}`

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error ?? "Failed to fetch swap history")
    }

    return response.json()
  } catch (error) {
    clearTimeout(timeoutId)
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request timed out")
    }
    throw error
  }
}
