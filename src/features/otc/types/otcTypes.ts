export interface OtcTrade {
  encrypted_payload: string
  iv: string
  pKey: string
}

export type CreateOtcTradeRequest = Omit<OtcTrade, "pKey">

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
