import {
  createWebauthnCredential,
  getWebauthnCredential,
} from "@src/features/webauthn/lib/webAuthnCredentialsAPI"
import { type WebauthnCredential, getRelayingPartyId } from "./webauthnService"

export async function getCredential(
  rawId: string
): Promise<WebauthnCredential> {
  const response = await getWebauthnCredential(rawId)
  return { rawId, publicKey: response.public_key, hostname: response.hostname }
}

export async function saveCredential(
  credential: WebauthnCredential
): Promise<void> {
  await retryOperation(async () => {
    const response = await createWebauthnCredential({
      raw_id: credential.rawId,
      public_key: credential.publicKey,
      hostname: getRelayingPartyId(),
    })
    if (!response.success) {
      throw new Error("Failed to save credential")
    }
  })
}

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 10,
  delay = 1000
): Promise<T> {
  let lastError: Error | undefined
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }
  throw lastError ?? new Error("Operation failed after max retries")
}
