import { logger } from "@src/utils/logger"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { decodeSecretKey, encodeSecretKey } from "./encoder"

export function createGiftCardLink(secretKey: string): string {
  const url = new URL("/gift-card/view-gift", window.location.origin)
  url.searchParams.set("gift", encodeSecretKey(secretKey))
  return url.toString()
}

export function useGiftCard() {
  const encodedGift = useSearchParams().get("gift")

  const [payload] = useState(() => {
    try {
      return decodeSecretKey(encodedGift ?? "")
    } catch (e) {
      logger.error(e)
      return ""
    }
  })

  return payload
}
