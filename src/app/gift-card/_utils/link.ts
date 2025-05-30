import { base64urlnopad } from "@scure/base"
import {
  genPKey,
  getGiftEncryptedIntent,
  saveGiftIntent,
} from "@src/features/gift/lib/giftService"
import { deriveIdFromIV } from "@src/utils/deriveIdFromIV"
import { logger } from "@src/utils/logger"
import { useQuery } from "@tanstack/react-query"
import {
  decodeAES256Gift,
  decodeGift,
  encodeAES256Gift,
  encodeGift,
} from "./encoder"

type GiftLinkData = {
  secretKey: string
  message: string
}

type GiftLinkPayload = {
  iv: null | string
} & GiftLinkData

export function createGiftLink(payload: GiftLinkPayload): string {
  const url = new URL("/gift-card/view-gift", window.location.origin)
  if (payload.iv) {
    url.hash = payload.iv
    return url.toString()
  }
  url.hash = encodeGift({
    secretKey: payload.secretKey,
    message: payload.message,
  })
  return url.toString()
}

export async function createGiftIntent(payload: GiftLinkData): Promise<{
  iv: string
}> {
  try {
    // Generate client-side IV and pKey for the order
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const pKey = await genPKey()

    const encrypted = await encodeAES256Gift(payload, pKey, iv)

    const encodedIv = base64urlnopad.encode(iv)
    const giftId = deriveIdFromIV(encodedIv)

    const result = await saveGiftIntent({
      gift_id: giftId,
      encrypted_payload: encrypted,
      p_key: pKey,
    })
    if (!result.success) {
      throw new Error("Failed to save trade")
    }
    return {
      iv: encodedIv,
    }
  } catch (e) {
    throw new Error("Failed to create order")
  }
}

export function useGiftIntent() {
  const encodedGift = window.location.hash.slice(1)

  const { data } = useQuery({
    queryKey: ["gift_intent", encodedGift],
    queryFn: async () => {
      // 1. Attempt: Try to fetch and decrypt the order from the database
      if (encodedGift) {
        try {
          const gift = await getGiftEncryptedIntent(decodeGift(encodedGift))
          if (gift) {
            const { encryptedPayload, pKey, iv } = gift
            if (!iv || !pKey) {
              throw new Error("Invalid decoded params")
            }
            const decrypted = await decodeAES256Gift(encryptedPayload, pKey, iv)
            return {
              payload: decrypted,
            }
          }
        } catch (error) {
          logger.error("Failed to decrypt order")
        }
      }

      // 2. Attempt: Try to decode the order directly from the URL
      try {
        const decoded = decodeGift(encodedGift)
        return {
          payload: decoded,
        }
      } catch (error) {
        logger.error("Failed to decode legacy order")
      }

      return {
        payload: "",
      }
    },
    enabled: !!encodedGift,
  })

  return {
    payload: data?.payload ?? null,
  }
}
