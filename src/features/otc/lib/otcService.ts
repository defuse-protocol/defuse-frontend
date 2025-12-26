import { base64urlnopad } from "@scure/base"
import { deriveTradeIdFromIV } from "@src/app/(app)/otc/_utils/encoder"
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
  const { tradeId, pKey, iv } = deriveTradeParams(params)

  // Get trade ID either directly or derive it from IV
  const resolvedTradeId = tradeId || (iv ? deriveTradeIdFromIV(iv) : null)
  if (!resolvedTradeId) {
    throw new Error("Invalid trade params")
  }

  const response = await getOTCTrade(resolvedTradeId)
  return {
    tradeId: resolvedTradeId,
    encryptedPayload: response.encrypted_payload,
    iv: iv ?? response.iv,
    pKey: pKey ?? response.p_key,
  }
}

export async function saveTrade(
  trade: CreateOtcTradeRequest
): Promise<CreateOtcTradeResponse> {
  const response = await createOTCTrade({
    trade_id: trade.trade_id,
    encrypted_payload: trade.encrypted_payload,
    ...("iv" in trade ? { iv: trade.iv } : { p_key: trade.p_key }),
  })
  if (!response.success) {
    throw new Error("Failed to save credential")
  }
  return {
    success: response.success,
  }
}

function deriveTradeParams(params: string): {
  tradeId: string | null
  pKey: string | null
  iv: string | null
} {
  // v1: tradeId#pKey
  const [tradeId, pKey] = params.split("#")
  if (tradeId && pKey) {
    return { tradeId, pKey, iv: null }
  }
  // v2: iv
  return { iv: params, tradeId: null, pKey: null }
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
