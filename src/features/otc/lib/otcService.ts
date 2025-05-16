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
    tradeId,
    encrypted_payload: response.encrypted_payload,
    iv: response.iv,
    pKey: pKey,
  }
}

export async function saveTrade(
  trade: Omit<OtcTrade, "pKey" | "tradeId">
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

/**
 * Gives short and unique trade id, shouldn't be used for any serious persistence purposes.
 * Note: Collisions are possible, use it only for temporary local identification.
 */
export function genLocalTradeId(multiPayloadPlain: string): string {
  const hash = dfjb2(multiPayloadPlain)
  return Math.abs(hash).toString(16).padStart(8, "0")
}

/**
 * Quick and simple hash algorithm
 */
function dfjb2(str: string) {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) + hash + char // hash * 33 + char
  }
  return hash
}
