import type {
  SwapHistoryParams,
  SwapHistoryResponse,
} from "@src/features/balance-history/types"
import { BASE_URL } from "@src/utils/environment"

export async function fetchSwapHistory(
  params: SwapHistoryParams
): Promise<SwapHistoryResponse> {
  const { accountId, page, limit } = params

  const searchParams = new URLSearchParams()
  if (page) searchParams.set("page", String(page))
  if (limit) searchParams.set("limit", String(limit))

  const queryString = searchParams.toString()
  const url = `${BASE_URL}/api/balance-history/${encodeURIComponent(accountId)}${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error ?? "Failed to fetch swap history")
  }

  return response.json()
}
