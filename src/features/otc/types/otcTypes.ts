export interface OtcTrade {
  encrypted_payload: string
  iv: string
}

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
