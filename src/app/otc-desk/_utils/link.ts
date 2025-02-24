import { useSearchParams } from "next/navigation"
import { useState } from "react"

import { decodeOrder, encodeOrder } from "@src/app/otc-desk/_utils/encoder"
import { logger } from "@src/utils/logger"

export function createOTCOrderLink(payload: unknown): string {
  const url = new URL("/otc-desk/view-order", window.location.origin)
  url.searchParams.set("order", encodeOrder(payload))
  return url.toString()
}

export function useOTCOrder() {
  const encodedOrder = useSearchParams().get("order")

  const [payload] = useState(() => {
    try {
      return decodeOrder(encodedOrder ?? "")
    } catch (e) {
      logger.error(e)
      return ""
    }
  })

  return payload
}
