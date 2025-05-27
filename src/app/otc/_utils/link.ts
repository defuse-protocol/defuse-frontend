import { base64 } from "@scure/base"
import {
  decodeAES256Order,
  decodeOrder,
  encodeAES256Order,
  encodeOrder,
} from "@src/app/otc/_utils/encoder"
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
  tradeId: string,
  pKey: string,
  /**
   * Required for backwards compatibility
   * @deprecated
   */
  multiPayload: unknown
) {
  const url = new URL("/otc/order", window.location.origin)
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
}> {
  try {
    // Generate client-side IV and pKey for the order
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const pKey = await genPKey()

    const encrypted = await encodeAES256Order(payload, pKey, iv)

    const result = await saveTrade({
      encrypted_payload: encrypted,
      iv: base64.encode(iv),
    })
    if (!result.success) {
      throw new Error("Failed to save trade")
    }
    return {
      tradeId: result.trade_id,
      pKey,
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
        const trade = await getTrade(decodeOrder(order))
        if (trade) {
          try {
            const { encrypted_payload, iv, pKey } = trade
            const decrypted = await decodeAES256Order(
              encrypted_payload,
              pKey,
              iv
            )
            return {
              tradeId: trade.tradeId,
              multiPayload: decrypted,
            }
          } catch (error) {
            logger.error("Failed to decrypt order")
            return {
              tradeId: null,
              multiPayload: "",
            }
          }
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
          logger.error("Failed to decode order")
          return {
            tradeId: null,
            multiPayload: "",
          }
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
