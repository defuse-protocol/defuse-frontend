export interface OtcTrade {
  tradeId: string
  encrypted_payload: string
  iv: string
  pKey: string
}

export type CreateOtcTradeRequest = Omit<OtcTrade, "pKey" | "tradeId">

export interface CreateOtcTradeResponse {
  success: boolean
  trade_id: string
}

export interface GetOtcTradeResponse {
  encrypted_payload: string
  iv: string
}

export interface ErrorResponse {
  error: string | object
}
