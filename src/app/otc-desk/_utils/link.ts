import { base64 } from "@scure/base"
import {
  decodeAES256Order,
  decodeOrder,
  encodeAES256Order,
} from "@src/app/otc-desk/_utils/encoder"
import {
  genLocalTradeId,
  genPKey,
  getTrade,
  saveTrade,
} from "@src/features/otc/lib/otcService"
import type { OtcTrade } from "@src/features/otc/types/otcTypes"
import { logger } from "@src/utils/logger"
import { useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

export function createOtcOrderLink(tradeId: string, pKey: string) {
  const url = new URL("/otc-desk/view-order", window.location.origin)
  url.searchParams.set("order", `${tradeId}#${pKey}`)
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
  const order = useSearchParams().get("order")
  const [multiPayload, setPayload] = useState<string | null>(null)
  const [tradeId, setTradeId] = useState<string | null>(null)

  const { data: trade, isFetched } = useQuery({
    queryKey: ["otc_trade", order],
    queryFn: () => getTrade(order),
    enabled: !!order,
  })

  const decrypt = useCallback(async (trade: OtcTrade) => {
    const { encrypted_payload, iv, pKey } = trade
    const decrypted = await decodeAES256Order(encrypted_payload, pKey, iv)
    return decrypted
  }, [])

  useEffect(() => {
    if (!isFetched) {
      return
    }
    // 1. Attempt: Try to fetch and decrypt the order from the database
    // This handles the new encrypted format with shorter URLs
    if (trade) {
      decrypt(trade)
        .then((decrypted) => {
          setPayload(decrypted)
          setTradeId(trade.tradeId)
        })
        .catch(() => {
          logger.error("Failed to decrypt order")
          setPayload("")
          setTradeId(null)
        })
      return
    }

    // 2. Attempt: Try to decode the order directly from the URL
    // This maintains backward compatibility with older order links
    try {
      const decoded = order ? decodeOrder(order) : ""
      setPayload(decoded)
      setTradeId(genLocalTradeId(decoded))
    } catch {
      logger.error("Failed to decode order")
      setPayload("")
      setTradeId(null)
    }
  }, [trade, isFetched, order, decrypt])

  return {
    tradeId,
    multiPayload,
  }
}
