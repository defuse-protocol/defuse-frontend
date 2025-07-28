import type { AuthMethod } from "../types/authHandle"
import type { IntentsUserId } from "../types/intentsUserId"
import type { WalletSignatureResult } from "../types/walletMessage"
import { authHandleToIntentsUserId } from "../utils/authIdentity"
import { prepareSwapSignedData } from "../utils/prepareBroadcastRequest"

export type { IntentsUserId }

export interface SignerCredentials {
  /** The credential (blockchain address or WebAuthn public key) that will sign or has signed the intent */
  credential: string
  /** The type of credential (chain or authentication method) */
  credentialType: AuthMethod
}

/**
 * Serializes a signed intent into the protocol's wire format
 * Transforms both signature and message data into the standardized
 * encoding expected by the Near Intents Protocol
 *
 * @param signature The signature result from the wallet
 * @param credentials The signer's credentials
 * @returns Intent data serialized in protocol wire format
 */
export function formatSignedIntent(
  signature: WalletSignatureResult,
  credentials: SignerCredentials
) {
  return prepareSwapSignedData(signature, {
    userAddress: credentials.credential,
    userChainType: credentials.credentialType,
  })
}

/**
 * Converts a user's blockchain address or WebAuthn credential to a standardized Near Intents protocol ID
 * @param credentials The signer's credentials
 * @returns A standardized Near Intents protocol user ID
 */
export function formatUserIdentity(
  credentials: SignerCredentials
): IntentsUserId {
  return authHandleToIntentsUserId(
    credentials.credential,
    credentials.credentialType
  )
}
