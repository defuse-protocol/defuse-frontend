import { base64urlnopad } from "@scure/base"
import type {
  CreateOtcTradeRequest,
  CreateOtcTradeResponse,
  OtcTrade,
} from "../types/otcTypes"
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
  trade: CreateOtcTradeRequest
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
export async function genPKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: "AES-GCM",
      length: 256,
    },
    true,
    ["encrypt", "decrypt"]
  )
  const rawKey = await crypto.subtle.exportKey("raw", key)
  const keyBytes = new Uint8Array(rawKey)
  return base64urlnopad.encode(keyBytes)
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
