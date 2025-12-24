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

export interface ErrorResponse {
  error: string | object
}
