import {
  decodeAES256Order,
  decodeOrder,
  encodeAES256Order,
  encodeOrder,
} from "@src/app/otc-desk/_utils/encoder"
import { getTrade, saveTrade } from "@src/features/otc/lib/otcService"
import { ENCRYPTION_KEY } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export async function createOTCOrderLink(
  payload: unknown,
  tradeId: string
): Promise<string> {
  let orderId: string
  try {
    const encrypted = encodeAES256Order(payload, ENCRYPTION_KEY)
    await saveTrade({
      raw_id: tradeId,
      encrypted_payload: encrypted,
    })
    orderId = tradeId
  } catch (e) {
    // Fallback: If encryption or database storage fails,
    // encode the payload directly into the URL (results in longer URLs)
    orderId = encodeOrder(payload)
  }
  const url = new URL("/otc-desk/view-order", window.location.origin)
  url.searchParams.set("order", orderId)
  return url.toString()
}

export function useOTCOrder() {
  const encodedOrder = useSearchParams().get("order")
  const [payload, setPayload] = useState("")

  useEffect(() => {
    async function fetchOrder() {
      if (!encodedOrder) {
        setPayload("")
        return
      }

      // 1. Attempt: Try to fetch and decrypt the order from the database
      // This handles the new encrypted format with shorter URLs
      try {
        const encryptedPayload = await getTrade(encodedOrder)

        if (encryptedPayload) {
          const decrypted = decodeAES256Order(
            encryptedPayload.encrypted_payload,
            ENCRYPTION_KEY
          )
          setPayload(decrypted)
          return
        }
      } catch {
        logger.error("Failed to get trade from DB")
      }

      // 2. Attempt: Try to decode the order directly from the URL
      // This maintains backward compatibility with older order links
      try {
        const decoded = decodeOrder(encodedOrder)
        setPayload(decoded)
      } catch {
        logger.error("Failed to decode order")
        setPayload("")
      }
    }

    fetchOrder()
  }, [encodedOrder])

  return payload
}
