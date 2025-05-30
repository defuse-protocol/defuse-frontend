import { BASE_URL } from "@src/utils/environment"
import type {
  CreateGiftRequest,
  CreateGiftResponse,
  ErrorResponse,
  GetGiftResponse,
} from "../types/giftTypes"

export async function createGift(request: CreateGiftRequest) {
  const response = await fetch(`${BASE_URL}/api/gifts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    await handleApiError(response, "Failed to request Gift")
  }

  return response.json() as Promise<CreateGiftResponse>
}

export async function getGift(tradeId: string) {
  const response = await fetch(`${BASE_URL}/api/gifts/${tradeId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    await handleApiError(response, "Failed to verify Gift")
  }

  return response.json() as Promise<GetGiftResponse>
}

async function handleApiError(response: Response, fallbackMessage: string) {
  const error = (await response.json()) as ErrorResponse
  throw new Error(
    typeof error.error === "string" ? error.error : fallbackMessage
  )
}
