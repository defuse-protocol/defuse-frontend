import { base64urlnopad } from "@scure/base"
import { deriveIdFromIV } from "@src/utils/deriveIdFromIV"
import type {
  CreateGiftRequest,
  CreateGiftResponse,
  Gift,
} from "../types/giftTypes"
import { createGift, getGift } from "./giftAPI"

export async function getGiftEncryptedIntent(
  params: string | null
): Promise<Gift | null> {
  if (!params) {
    return null
  }
  const { giftId, iv } = getGiftAccessParams(params)

  const response = await getGift(giftId)
  return {
    giftId,
    encryptedPayload: response.encrypted_payload,
    pKey: response.p_key,
    iv,
    expiresAt: response.expires_at,
  }
}

export async function saveGiftIntent(
  trade: CreateGiftRequest
): Promise<CreateGiftResponse> {
  const response = await createGift({
    gift_id: trade.gift_id,
    encrypted_payload: trade.encrypted_payload,
    p_key: trade.p_key,
    expires_at: trade.expires_at,
  })
  if (!response.success) {
    throw new Error("Failed to save gift")
  }
  return {
    success: response.success,
  }
}

function getGiftAccessParams(params: string): {
  iv: string
  giftId: string
} {
  const [iv] = params.split("#")
  const giftId = deriveIdFromIV(iv)
  return { iv, giftId }
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
