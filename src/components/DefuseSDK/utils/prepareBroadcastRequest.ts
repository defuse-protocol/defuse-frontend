import type { solverRelay } from "@defuse-protocol/internal-utils"
import { base58, base64, hex } from "@scure/base"
import type { AuthMethod } from "../types/authHandle"
import type { WalletSignatureResult } from "../types/walletMessage"
import { assert } from "./assert"
import { makeWebAuthnMultiPayload } from "./multiPayload/webauthn"
import { stellarAddressToBytes } from "./stellarAddressToBytes"

export function prepareSwapSignedData(
  signature: WalletSignatureResult,
  userInfo: { userAddress: string; userChainType: AuthMethod }
): solverRelay.Params<solverRelay.PublishIntentRequest>["signed_data"] {
  const signatureType = signature.type
  switch (signatureType) {
    case "NEP413": {
      return {
        standard: "nep413",
        payload: {
          message: signature.signedData.message,
          nonce: base64.encode(signature.signedData.nonce),
          recipient: signature.signedData.recipient,
          callbackUrl: signature.signedData.callbackUrl,
        },
        public_key: signature.signatureData.publicKey, // publicKey is already in the correct format
        signature: transformNEP141Signature(signature.signatureData.signature),
      }
    }

    case "ERC191": {
      return {
        standard: "erc191",
        payload: signature.signedData.message,
        signature: transformERC191Signature(signature.signatureData),
      }
    }

    case "SOLANA":
      assert(
        userInfo.userChainType === "solana",
        "User chain and signature chain must match"
      )
      return {
        standard: "raw_ed25519",
        payload: new TextDecoder().decode(signature.signedData.message),
        // Solana address is its public key encoded in base58
        public_key: `ed25519:${userInfo.userAddress}`,
        signature: transformSolanaSignature(signature.signatureData),
      }

    case "WEBAUTHN": {
      return makeWebAuthnMultiPayload(userInfo, signature)
    }

    case "TON_CONNECT": {
      return {
        standard: "ton_connect",
        address: signature.signatureData.address,
        domain: signature.signatureData.domain,
        timestamp: signature.signatureData.timestamp,
        payload: signature.signatureData.payload,
        public_key: `ed25519:${base58.encode(hex.decode(userInfo.userAddress))}`,
        signature: `ed25519:${base58.encode(base64.decode(signature.signatureData.signature))}`,
      }
    }

    case "STELLAR": {
      assert(
        userInfo.userChainType === "stellar",
        "User chain and signature chain must match"
      )
      return {
        standard: "raw_ed25519",
        payload: signature.signedData.message,
        // We should encode the Stellar address to base58
        public_key: `ed25519:${base58.encode(
          stellarAddressToBytes(userInfo.userAddress)
        )}`,
        signature: `ed25519:${base58.encode(signature.signatureData)}`,
      }
    }

    default:
      signatureType satisfies never
      throw new Error("exhaustive check failed")
  }
}

function transformNEP141Signature(signature: string) {
  const encoded = base58.encode(base64.decode(signature))
  return `ed25519:${encoded}`
}

export function transformERC191Signature(signature: string) {
  const normalizedSignature = normalizeERC191Signature(signature)
  const bytes = hex.decode(
    normalizedSignature.startsWith("0x")
      ? normalizedSignature.slice(2)
      : normalizedSignature
  )
  return `secp256k1:${base58.encode(bytes)}`
}

export function normalizeERC191Signature(signature: string): string {
  // Get `v` from the last two characters
  let v = Number.parseInt(signature.slice(-2), 16)

  // // Normalize `v` to be either 0 or 1
  v = toRecoveryBit(v)

  // Convert `v` back to hex
  const vHex = v.toString(16).padStart(2, "0")

  // Reconstruct the full signature with the adjusted `v`
  return signature.slice(0, -2) + vHex
}

// Copy from viem/utils/signature/recoverPublicKey.ts
function toRecoveryBit(yParityOrV: number) {
  if (yParityOrV === 0 || yParityOrV === 1) return yParityOrV
  if (yParityOrV === 27) return 0
  if (yParityOrV === 28) return 1
  throw new Error("Invalid yParityOrV value")
}

function transformSolanaSignature(signature: Uint8Array) {
  return `ed25519:${base58.encode(signature)}`
}
