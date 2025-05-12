import { getRelayingPartyId } from "@src/features/webauthn/lib/webauthnService"
import type { OtcTrade } from "../types/otcTypes"
import { createOTCTrade, getOTCTrade } from "./otcAPI"

export async function getTrade(
  tradeId: string
): Promise<Omit<OtcTrade, "hostname">> {
  const response = await getOTCTrade(tradeId)
  return {
    raw_id: tradeId,
    encrypted_payload: response.encrypted_payload,
  }
}

export async function saveTrade(
  trade: Omit<OtcTrade, "hostname">
): Promise<void> {
  const response = await createOTCTrade({
    raw_id: trade.raw_id,
    encrypted_payload: trade.encrypted_payload,
    hostname: getRelayingPartyId(),
  })
  if (!response.success) {
    throw new Error("Failed to save credential")
  }
}
