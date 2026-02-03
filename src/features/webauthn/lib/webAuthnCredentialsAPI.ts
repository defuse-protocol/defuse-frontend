import type {
  CreateCredentialResponse,
  ErrorResponse,
  GetCredentialResponse,
  WebauthnCredential,
} from "@src/features/webauthn/types/webAuthnTypes"
import { BASE_URL } from "@src/utils/environment"

export async function createWebauthnCredential(credential: WebauthnCredential) {
  const response = await fetch(`${BASE_URL}/api/webauthn_credentials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credential),
  })

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse
    throw new Error(
      typeof error.error === "string"
        ? error.error
        : "Failed to create credential"
    )
  }

  return response.json() as Promise<CreateCredentialResponse>
}

export async function getWebauthnCredential(rawId: string) {
  const response = await fetch(`${BASE_URL}/api/webauthn_credentials/${rawId}`)

  if (!response.ok) {
    const error = (await response.json()) as ErrorResponse
    const message =
      typeof error.error === "string"
        ? error.error
        : "Failed to fetch credential"
    throw new Error(message)
  }

  return response.json() as Promise<GetCredentialResponse>
}

/** Message thrown when GET credential returns 404 (passkey not registered in our backend). */
export const CREDENTIAL_NOT_FOUND_MESSAGE = "Credential not found"
