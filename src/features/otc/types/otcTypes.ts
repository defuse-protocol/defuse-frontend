export interface OtcTrade {
  raw_id: string
  encrypted_payload: string
  hostname: string
}

export interface CreateOtcTradeResponse {
  success: boolean
}

export interface GetOtcTradeResponse {
  encrypted_payload: string
}

export interface ErrorResponse {
  error: string | object
}
