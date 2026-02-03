import type { walletMessage as walletMessage_ } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"

/**
 * Client-side serialization of wallet signatures for Server Actions.
 *
 * WHY THIS EXISTS
 * --------------
 * Server Actions send their arguments over the network using a JSON-like
 * serialization. Binary types (Uint8Array, ArrayBuffer) cannot be serialized
 * and would be lost or become empty objects if passed directly. So we cannot
 * "just pass what the user signed" when the signature contains binary data.
 *
 * This module encodes those binary fields as base64 strings so they survive
 * the client→server round trip. The server decodes them back to bytes in
 * serverSignatureVerification.ts (see base64ToUint8Array and the "serialized"
 * branches in verifySolanaSignature, verifyWebAuthnSignature, verifyStellarSignature).
 *
 * WHICH TYPES NEED SERIALIZATION
 * -----------------------------
 * - WEBAUTHN: clientDataJSON, authenticatorData, signature, userHandle, challenge
 * - NEP413:    nonce
 * - SOLANA:    signatureData, signedData.message
 * - STELLAR_SEP53: signatureData
 *
 * ERC191, TON_CONNECT, TRON have no binary fields and are passed through as-is.
 */

/** One signature variant by type tag (avoids repeating long Extract<>). */
type Sig<T extends walletMessage_.WalletSignatureResult["type"]> = Extract<
  walletMessage_.WalletSignatureResult,
  { type: T }
>

/** Serialized (base64 string) shapes for signature types that contain binary. */

/** WebAuthn signatureData with binary fields as base64 (Server Action compatible). */
export interface SerializedWebAuthnSignature {
  clientDataJSON: string
  authenticatorData: string
  signature: string
  userHandle: string | null
}

/** WebAuthn signedData with challenge as base64 (Server Action compatible). */
export interface SerializedWebAuthnSignedData {
  challenge: string
  payload: string
  parsedPayload: unknown
}

interface SerializedWebAuthnSignatureData {
  type: "WEBAUTHN"
  signatureData: SerializedWebAuthnSignature
  signedData: SerializedWebAuthnSignedData
}

interface SerializedNEP413SignatureData {
  type: "NEP413"
  signatureData: Sig<"NEP413">["signatureData"]
  signedData: Omit<Sig<"NEP413">["signedData"], "nonce"> & { nonce: string }
}

interface SerializedSolanaSignatureData {
  type: "SOLANA"
  signatureData: string
  signedData: { message: string }
}

interface SerializedStellarSignatureData {
  type: "STELLAR_SEP53"
  signatureData: string
  signedData: Sig<"STELLAR_SEP53">["signedData"]
}

/** Pass-through variants (no binary fields). */
type PassThroughSignature = Sig<"ERC191"> | Sig<"TON_CONNECT"> | Sig<"TRON">

/**
 * Result of serializing a wallet signature for Server Actions.
 * Binary fields are base64 strings; server decodes in serverSignatureVerification.ts.
 */
export type SerializedWalletSignatureResult =
  | SerializedWebAuthnSignatureData
  | SerializedNEP413SignatureData
  | SerializedSolanaSignatureData
  | SerializedStellarSignatureData
  | PassThroughSignature

/**
 * Serializes a wallet signature so it can be passed to a Server Action.
 * Converts any Uint8Array/ArrayBuffer fields to base64 strings.
 */
export function serializeSignatureForServerAction(
  signature: walletMessage_.WalletSignatureResult
): SerializedWalletSignatureResult {
  switch (signature.type) {
    case "WEBAUTHN": {
      const rawSignatureData = signature.signatureData
      const result: SerializedWebAuthnSignatureData = {
        type: "WEBAUTHN",
        signatureData: {
          clientDataJSON: bufferToBase64(rawSignatureData.clientDataJSON),
          authenticatorData: bufferToBase64(rawSignatureData.authenticatorData),
          signature: bufferToBase64(rawSignatureData.signature),
          userHandle: rawSignatureData.userHandle
            ? bufferToBase64(rawSignatureData.userHandle)
            : null,
        },
        signedData: {
          challenge: bufferToBase64(signature.signedData.challenge),
          payload: signature.signedData.payload,
          parsedPayload: signature.signedData.parsedPayload,
        },
      }
      return result
    }

    case "NEP413": {
      const result: SerializedNEP413SignatureData = {
        type: "NEP413",
        signatureData: signature.signatureData,
        signedData: {
          message: signature.signedData.message,
          recipient: signature.signedData.recipient,
          nonce: bufferToBase64(signature.signedData.nonce),
          callbackUrl: signature.signedData.callbackUrl,
        },
      }
      return result
    }

    case "SOLANA": {
      const result: SerializedSolanaSignatureData = {
        type: "SOLANA",
        signatureData: bufferToBase64(signature.signatureData),
        signedData: {
          message: bufferToBase64(signature.signedData.message),
        },
      }
      return result
    }

    case "STELLAR_SEP53": {
      const result: SerializedStellarSignatureData = {
        type: "STELLAR_SEP53",
        signatureData: bufferToBase64(signature.signatureData),
        signedData: signature.signedData,
      }
      return result
    }

    // ERC191, TON_CONNECT, TRON have no Uint8Array fields
    default:
      return signature
  }
}

function bufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return base64.encode(bytes)
}
