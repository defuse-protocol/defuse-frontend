import type {
  CreateOtcTradeResponse,
  ErrorResponse,
  GetOtcTradeResponse,
  OtcTrade,
} from "@src/features/otc/types/otcTypes"
import { BASE_URL } from "@src/utils/environment"

export async function createOTCTrade(request: OtcTrade) {
  const response = await fetch(`${BASE_URL}/api/otc_trades`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse
    throw new Error(
      typeof error.error === "string" ? error.error : "Failed to request OTC"
    )
  }

  return response.json() as Promise<CreateOtcTradeResponse>
}

export async function getOTCTrade(tradeId: string) {
  const response = await fetch(`${BASE_URL}/api/otc_trades/${tradeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse
    throw new Error(
      typeof error.error === "string" ? error.error : "Failed to verify OTC"
    )
  }

  return response.json() as Promise<GetOtcTradeResponse>
}
