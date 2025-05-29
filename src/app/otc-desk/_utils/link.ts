import { base64urlnopad } from "@scure/base"
import {
  decodeAES256Order,
  decodeOrder,
  deriveTradeIdFromIV,
  encodeAES256Order,
  encodeOrder,
} from "@src/app/otc-desk/_utils/encoder"
import {
  genLocalTradeId,
  genPKey,
  getTrade,
  saveTrade,
} from "@src/features/otc/lib/otcService"
import { logger } from "@src/utils/logger"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"

export function createOtcOrderLink(
  /** @deprecated Required for backwards compatibility */
  tradeId: string,
  /** @deprecated Required for backwards compatibility */
  pKey: string,
  /** @deprecated Required for backwards compatibility */
  multiPayload: unknown,
  iv: string
) {
  const url = new URL("/otc-desk/view-order", window.location.origin)
  if (iv) {
    url.hash = iv
    return url.toString()
  }
  if (tradeId && pKey) {
    url.hash = encodeOrder(`${tradeId}#${pKey}`)
    return url.toString()
  }
  // Allow generation of links from multiPayload for backwards compatibility
  url.searchParams.set("order", encodeOrder(multiPayload))
  return url.toString()
}

export async function createOtcOrder(payload: unknown): Promise<{
  tradeId: string
  pKey: string
  iv: string
}> {
  try {
    // Generate client-side IV and pKey for the order
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const pKey = await genPKey()

    const encrypted = await encodeAES256Order(payload, pKey, iv)

    const encodedIv = base64urlnopad.encode(iv)
    const tradeId = deriveTradeIdFromIV(encodedIv)

    const result = await saveTrade({
      trade_id: tradeId,
      encrypted_payload: encrypted,
      p_key: pKey,
    })
    if (!result.success) {
      throw new Error("Failed to save trade")
    }
    return {
      tradeId,
      pKey,
      iv: encodedIv,
    }
  } catch (e) {
    throw new Error("Failed to create order")
  }
}

export function useOtcOrder() {
  const order = window.location.hash.slice(1)
  const legacyOrder = useSearchParams().get("order")

  const { data } = useQuery({
    queryKey: ["otc_trade", order, legacyOrder],
    queryFn: async () => {
      // 1. Attempt: Try to fetch and decrypt the order from the database
      if (order) {
        try {
          const trade = await getTrade(decodeOrder(order))
          if (trade) {
            const { encryptedPayload, iv, pKey } = trade
            if (!iv || !pKey) {
              throw new Error("Invalid decoded params")
            }
            const decrypted = await decodeAES256Order(
              encryptedPayload,
              pKey,
              iv
            )
            return {
              tradeId: trade.tradeId,
              multiPayload: decrypted,
            }
          }
        } catch (error) {
          logger.error("Failed to decrypt order")
        }
      }

      // 2. Attempt: Try to decode the order directly from the URL
      if (legacyOrder) {
        try {
          const decoded = decodeOrder(legacyOrder)
          return {
            tradeId: genLocalTradeId(decoded),
            multiPayload: decoded,
          }
        } catch (error) {
          logger.error("Failed to decode legacy order")
        }
      }

      return {
        tradeId: null,
        multiPayload: "",
      }
    },
    enabled: !!order || legacyOrder !== null,
  })

  return {
    tradeId: data?.tradeId ?? null,
    multiPayload: data?.multiPayload ?? null,
  }
}
