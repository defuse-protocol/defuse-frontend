import { base64urlnopad } from "@scure/base"
import type { GiftLinkData } from "@src/components/DefuseSDK/features/gift/types/sharedTypes"
import {
  genPKey,
  getGiftEncryptedIntent,
  saveGiftIntent,
} from "@src/features/gift/lib/giftService"
import { deriveIdFromIV } from "@src/utils/deriveIdFromIV"
import { logger } from "@src/utils/logger"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import {
  decodeAES256Gift,
  decodeGift,
  encodeAES256Gift,
  encodeGift,
} from "./encoder"

type GiftLinkPayload = {
  iv?: null | string
} & GiftLinkData

export function createGiftLink(payload: GiftLinkPayload): string {
  const url = new URL("/gift", window.location.origin)
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
  giftId: string
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
      giftId,
    }
  } catch (err) {
    logger.error(new Error("Failed to create gift intent", { cause: err }))
    throw new Error("Failed to create order")
  }
}

export function useGiftIntent() {
  // Use state to properly handle client-side hash reading
  const [encodedGift, setEncodedGift] = useState("")

  useEffect(() => {
    // Read hash on client-side mount
    const hash = window.location.hash.slice(1)
    setEncodedGift(hash)

    // Listen for hash changes
    const handleHashChange = () => {
      setEncodedGift(window.location.hash.slice(1))
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const { data, error, isLoading } = useQuery({
    queryKey: ["gift_intent", encodedGift],
    queryFn: async (): Promise<{
      payload: string
      giftId?: string
    }> => {
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
              giftId: deriveIdFromIV(iv),
            }
          }
        } catch (err) {
          logger.error(new Error("Failed to decrypt order", { cause: err }))
        }
      }

      // 2. Attempt: Try to decode the order directly from the URL
      try {
        const decoded = decodeGift(encodedGift)
        // Only return if we got valid JSON with secretKey (legacy format)
        if (decoded && typeof decoded === "object") {
          return {
            payload: decoded,
          }
        }
      } catch (err) {
        logger.error(new Error("Failed to decode legacy order", { cause: err }))
      }

      // If we reach here, we couldn't decode the gift
      throw new Error("Gift not found or invalid")
    },
    enabled: !!encodedGift,
    retry: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })

  const payload = data?.payload ?? null
  const giftId = data?.giftId ?? null

  return {
    payload,
    giftId,
    error: error ? (error as Error).message : null,
    isLoading,
  }
}
