export interface WebauthnCredential {
  raw_id: string
  public_key: string
  hostname: string
}

export interface CreateCredentialResponse {
  success: boolean
}

export interface GetCredentialResponse {
  public_key: string
  hostname: string
}

export const WebAuthnErrorCode = {
  CREDENTIAL_NOT_FOUND: "CREDENTIAL_NOT_FOUND",
  INVALID_FORMAT: "INVALID_FORMAT",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const

export type WebAuthnErrorCode =
  (typeof WebAuthnErrorCode)[keyof typeof WebAuthnErrorCode]

export interface ErrorResponse {
  error: string | object
  code?: WebAuthnErrorCode
}
