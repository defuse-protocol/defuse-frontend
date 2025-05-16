import type { CreateOtcTradeResponse, OtcTrade } from "../types/otcTypes"
import { createOTCTrade, getOTCTrade } from "./otcAPI"

export async function getTrade(
  params: string | null
): Promise<OtcTrade | null> {
  if (!params) {
    return null
  }
  const { tradeId, pKey } = deriveTradeParams(params)
  const response = await getOTCTrade(tradeId)
  return {
    encrypted_payload: response.encrypted_payload,
    iv: response.iv,
    pKey: pKey,
  }
}

export async function saveTrade(
  trade: Omit<OtcTrade, "pKey">
): Promise<CreateOtcTradeResponse> {
  const response = await createOTCTrade({
    encrypted_payload: trade.encrypted_payload,
    iv: trade.iv,
  })
  if (!response.success) {
    throw new Error("Failed to save credential")
  }
  return {
    success: response.success,
    trade_id: response.trade_id,
  }
}

function deriveTradeParams(params: string) {
  const [tradeId, pKey] = params.split("#")
  return { tradeId, pKey }
}

// Key for AES-256-GCM must be 32-bytes and URL safe
export function genPKey() {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .slice(0, 32)
}
