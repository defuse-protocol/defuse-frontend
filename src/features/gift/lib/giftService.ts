import { base64urlnopad } from "@scure/base"
import { v5 as uuidv5 } from "uuid"
import type {
  CreateGiftRequest,
  CreateGiftResponse,
  Gift,
} from "../types/giftTypes"
import { createGift, getGift } from "./giftAPI"

export async function getGiftIntent(
  params: string | null
): Promise<Gift | null> {
  if (!params) {
    return null
  }
  const { iv } = deriveGiftParams(params)

  const resolvedGiftId = deriveGiftIdFromIV(iv)
  if (!resolvedGiftId) {
    throw new Error("Invalid trade params")
  }

  const response = await getGift(resolvedGiftId)
  return {
    giftId: resolvedGiftId,
    encryptedPayload: response.encrypted_payload,
    iv,
    pKey: response.p_key,
  }
}

export async function saveGiftIntent(
  trade: CreateGiftRequest
): Promise<CreateGiftResponse> {
  const response = await createGift({
    gift_id: trade.gift_id,
    encrypted_payload: trade.encrypted_payload,
    p_key: trade.p_key,
  })
  if (!response.success) {
    throw new Error("Failed to save gift")
  }
  return {
    success: response.success,
  }
}

function deriveGiftParams(params: string): {
  iv: string
} {
  const [iv] = params.split("#")
  return { iv }
}

// Key for AES-256-GCM must be 32-bytes and URL safe
export async function genPKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
  const rawKey = await crypto.subtle.exportKey("raw", key)
  const keyBytes = new Uint8Array(rawKey)
  return base64urlnopad.encode(keyBytes)
}

export function deriveGiftIdFromIV(iv: string): string {
  return uuidv5(iv, "6ba7b810-9dad-11d1-80b4-00c04fd430c8")
}
