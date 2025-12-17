import type {
  BalanceHistoryParams,
  BalanceHistoryResponse,
} from "@src/features/balance-history/types"
import { BASE_URL } from "@src/utils/environment"

export async function fetchBalanceHistory(
  params: BalanceHistoryParams
): Promise<BalanceHistoryResponse> {
  const { accountId, page, limit, startDate, endDate, tokenId, changeType } =
    params

  const searchParams = new URLSearchParams()
  if (page) searchParams.set("page", String(page))
  if (limit) searchParams.set("limit", String(limit))
  if (startDate) searchParams.set("startDate", startDate)
  if (endDate) searchParams.set("endDate", endDate)
  if (tokenId) searchParams.set("tokenId", tokenId)
  if (changeType) searchParams.set("changeType", changeType)

  const queryString = searchParams.toString()
  const url = `${BASE_URL}/api/balance-history/${encodeURIComponent(accountId)}${queryString ? `?${queryString}` : ""}`

  const response = await fetch(url)

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error ?? "Failed to fetch balance history")
  }

  return response.json()
}
