import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { decodeOrder, encodeOrder } from "@src/app/otc-desk/_utils/encoder"
import { logger } from "@src/utils/logger"

export function createGiftCardLink(payload: unknown): string {
  const url = new URL("/gift-card/view-gift", window.location.origin)
  url.searchParams.set("gift", encodeOrder(payload))
  return url.toString()
}

export function useGiftCard() {
  const encodedGift = useSearchParams().get("gift")

  const [payload] = useState(() => {
    try {
      return decodeOrder(encodedGift ?? "")
    } catch (e) {
      logger.error(e)
      return ""
    }
  })

  return payload
}
