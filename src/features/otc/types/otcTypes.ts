export interface OtcTrade {
  tradeId: string
  encryptedPayload: string
  iv: string | null
  pKey: string | null
}

export type CreateOtcTradeRequest = {
  trade_id: string
  encrypted_payload: string
} & ({ iv: string } | { p_key: string })

export interface CreateOtcTradeResponse {
  success: boolean
}

export interface GetOtcTradeResponse {
  encrypted_payload: string
  iv: string | null
  p_key: string | null
}

export interface ErrorResponse {
  error: string | object
}
