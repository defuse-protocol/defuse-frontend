export interface Gift {
  giftId: string
  encryptedPayload: string
  pKey: string | null
  iv: string | null
  expiresAt?: number | null
}

export type CreateGiftRequest = {
  gift_id: string
  encrypted_payload: string
  p_key: string
  expires_at?: number | null
}

export interface CreateGiftResponse {
  success: boolean
}

export interface GetGiftResponse {
  encrypted_payload: string
  p_key: string | null
  expires_at?: number | null
}

export interface ErrorResponse {
  error: string | object
}
