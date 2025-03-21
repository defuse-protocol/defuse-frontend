import { logger } from "@src/utils/logger"
import { useSearchParams } from "next/navigation"
import { useState } from "react"
import { decodeGift, encodeGift } from "./encoder"

export function createGiftCardLink(payload: unknown): string {
  const url = new URL("/gift-card/view-gift", window.location.origin)
  url.searchParams.set("#", encodeGift(payload))
  return url.toString()
}

export function useGiftCard() {
  const encodedGift = useSearchParams().get("#")

  const [payload] = useState(() => {
    try {
      return decodeGift(encodedGift ?? "")
    } catch (e) {
      logger.error(e)
      return ""
    }
  })

  return payload
}
