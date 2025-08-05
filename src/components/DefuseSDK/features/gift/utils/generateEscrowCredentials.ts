import { base58, hex } from "@scure/base"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import type { KeyPairString } from "near-api-js/lib/utils"
import { sign } from "tweetnacl"

export interface EscrowCredentials extends SignerCredentials {
  secretKey: KeyPairString
}

export function generateEscrowCredentials(): EscrowCredentials {
  const keyPair = sign.keyPair()
  return {
    secretKey: transformNEP413Key(keyPair.secretKey),
    credential: hex.encode(keyPair.publicKey),
    credentialType: "near",
  }
}

export function parseEscrowCredentials(secretKey: string): EscrowCredentials {
  const normalizedSecretKey = normalizeNEP413Key(secretKey)
  const secretKeyBase58 = base58.decode(normalizedSecretKey)
  const keyPair = sign.keyPair.fromSecretKey(secretKeyBase58)
  return {
    secretKey: transformNEP413Key(keyPair.secretKey),
    credential: hex.encode(keyPair.publicKey),
    credentialType: "near",
  }
}

function transformNEP413Key(key: Uint8Array): KeyPairString {
  return `ed25519:${base58.encode(key)}`
}

export function normalizeNEP413Key(key: string): string {
  const value = key.slice("ed25519:".length)
  if (!value) {
    throw new Error("Invalid NEP413 key format")
  }
  return value
}
