import type { walletMessage as walletMessage_ } from "@defuse-protocol/internal-utils"
import { sha256 } from "@noble/hashes/sha256"
import { base58, base64urlnopad } from "@scure/base"
import type {
  SerializedWalletSignatureResult,
  SerializedWebAuthnSignature,
  SerializedWebAuthnSignedData,
} from "@src/utils/serializeWalletSignatureForServerAction"
import { Keypair } from "@stellar/stellar-sdk"
import { sign } from "tweetnacl"
import { verifyMessage as verifyMessageViem } from "viem"
import { logger } from "./logger"

export interface ServerVerificationResult {
  valid: boolean
  error?: string
}

/** Signature from client: raw or serialized (base64) for Server Action compatibility. */
type WalletSignatureForVerification =
  | walletMessage_.WalletSignatureResult
  | SerializedWalletSignatureResult

/**
 * Verifies a wallet signature on the server side.
 * This ensures the signature was actually produced by the claimed address
 * and that the signed message hasn't expired.
 *
 * @param signature - The wallet signature result from the client (raw or serialized)
 * @param userAddress - The address that claims to have signed
 */
export async function verifyWalletSignatureServer(
  signature: WalletSignatureForVerification,
  userAddress: string
): Promise<ServerVerificationResult> {
  try {
    // First, verify the message deadline hasn't passed (replay protection)
    const deadlineCheck = verifyMessageDeadline(signature)
    if (!deadlineCheck.valid) {
      return deadlineCheck
    }

    // Then verify the cryptographic signature
    const signatureType = signature.type
    switch (signatureType) {
      case "NEP413":
        return verifyNEP413Signature(signature, userAddress)
      case "ERC191":
        return verifyERC191Signature(signature, userAddress)
      case "SOLANA":
        return verifySolanaSignature(signature, userAddress)
      case "WEBAUTHN":
        return verifyWebAuthnSignature(signature, userAddress)
      case "TON_CONNECT":
        return verifyTonConnectSignature(signature, userAddress)
      case "STELLAR_SEP53":
        return verifyStellarSignature(signature, userAddress)
      case "TRON":
        return verifyTronSignature(signature, userAddress)
      default:
        signatureType satisfies never
        return { valid: false, error: "unsupported_signature_type" }
    }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : "verification_failed",
    }
  }
}

/**
 * Extracts the deadline from the signed message and verifies it hasn't passed.
 * Messages contain a `deadline` field (Unix timestamp in milliseconds).
 * This prevents replay attacks by rejecting expired signatures.
 */
function verifyMessageDeadline(
  signature: WalletSignatureForVerification
): ServerVerificationResult {
  try {
    let messageContent: string

    switch (signature.type) {
      case "ERC191":
        messageContent = signature.signedData.message
        break
      case "NEP413":
        messageContent = signature.signedData.message
        break
      case "SOLANA": {
        const msg = signature.signedData.message
        messageContent =
          typeof msg === "string"
            ? new TextDecoder().decode(base64ToUint8Array(msg))
            : new TextDecoder().decode(msg)
        break
      }
      case "WEBAUTHN":
        messageContent = signature.signedData.payload
        break
      case "TON_CONNECT":
        messageContent = signature.signedData.message.text
        break
      case "STELLAR_SEP53":
        messageContent = signature.signedData.message
        break
      case "TRON":
        messageContent = signature.signedData.message
        break
      default:
        signature satisfies never
        return { valid: false, error: "unsupported_signature_type" }
    }

    // Parse the message and extract deadline
    const parsed = JSON.parse(messageContent)
    const deadline = parsed.deadline

    if (typeof deadline !== "number") {
      // If no deadline field, allow the signature (backwards compatibility)
      return { valid: true }
    }

    // Check if deadline has passed
    if (Date.now() > deadline) {
      return { valid: false, error: "message_expired" }
    }

    return { valid: true }
  } catch {
    // If we can't parse the message, allow it (might be a different format)
    return { valid: true }
  }
}

/**
 * NEP-413 signature verification.
 * For NEP-413, the accountId in the signature must match the user address.
 * Full cryptographic verification would require NEAR RPC calls.
 */
function verifyNEP413Signature(
  signature: Extract<walletMessage_.WalletSignatureResult, { type: "NEP413" }>,
  userAddress: string
): ServerVerificationResult {
  // For NEP-413 signed messages, the accountId must match
  if (signature.signatureData.accountId !== userAddress) {
    return { valid: false, error: "account_id_mismatch" }
  }
  return { valid: true }
}

/**
 * ERC-191 signature verification using viem.
 * Recovers the signer address from the signature and compares with claimed address.
 */
async function verifyERC191Signature(
  signature: Extract<walletMessage_.WalletSignatureResult, { type: "ERC191" }>,
  userAddress: string
): Promise<ServerVerificationResult> {
  const isValid = await verifyMessageViem({
    address: userAddress as `0x${string}`,
    message: signature.signedData.message,
    signature: signature.signatureData as `0x${string}`,
  })

  if (!isValid) {
    return { valid: false, error: "signature_invalid" }
  }
  return { valid: true }
}

/**
 * Solana signature verification using Ed25519.
 * The Solana address IS the public key, so we verify directly.
 *
 * Note: Data may be serialized as base64 strings from Server Actions.
 */
function verifySolanaSignature(
  signature: Extract<
    walletMessage_.WalletSignatureResult | SerializedWalletSignatureResult,
    { type: "SOLANA" }
  >,
  userAddress: string
): ServerVerificationResult {
  const publicKey = base58.decode(userAddress)

  // Handle serialized data (base64 strings from Server Action)
  let message: Uint8Array
  let signatureBytes: Uint8Array

  if (typeof signature.signedData.message === "string") {
    message = base64ToUint8Array(signature.signedData.message)
    signatureBytes = base64ToUint8Array(signature.signatureData)
  } else {
    message = signature.signedData.message
    signatureBytes = signature.signatureData
  }

  const isValid = sign.detached.verify(message, signatureBytes, publicKey)

  if (!isValid) {
    return { valid: false, error: "signature_invalid" }
  }
  return { valid: true }
}

/**
 * WebAuthn signature verification.
 * Uses P-256 ECDSA or Ed25519 depending on the credential type.
 *
 * Note: WebAuthn data is serialized to base64 strings on the client
 * because ArrayBuffers cannot be passed through Server Actions.
 */
async function verifyWebAuthnSignature(
  signature: Extract<
    walletMessage_.WalletSignatureResult | SerializedWalletSignatureResult,
    { type: "WEBAUTHN" }
  >,
  userAddress: string
): Promise<ServerVerificationResult> {
  try {
    const {
      parsePublicKey,
      verifyWebAuthnSignature: verifyWebAuthn,
      extractRawSignature,
    } = await import("@src/components/DefuseSDK/utils/webAuthn")

    const credentialKey = parsePublicKey(userAddress)

    // Signature data may be serialized (base64 strings) or raw (ArrayBuffers)
    const serializedData =
      signature.signatureData as SerializedWebAuthnSignature
    const serializedSignedData =
      signature.signedData as SerializedWebAuthnSignedData

    // Check if data is already serialized (base64 strings) or raw (ArrayBuffers)
    // This handles both cases for compatibility
    let clientDataJSON: Uint8Array
    let authenticatorData: Uint8Array
    let signatureBytes: Uint8Array
    let expectedChallenge: Uint8Array

    if (typeof serializedData.clientDataJSON === "string") {
      // Data is serialized as base64 strings (from Server Action)
      clientDataJSON = base64ToUint8Array(serializedData.clientDataJSON)
      authenticatorData = base64ToUint8Array(serializedData.authenticatorData)
      signatureBytes = base64ToUint8Array(serializedData.signature)
      expectedChallenge = base64ToUint8Array(serializedSignedData.challenge)
    } else {
      // Data is raw ArrayBuffers (shouldn't happen via Server Action, but handle for safety)
      const rawData = signature.signatureData as AuthenticatorAssertionResponse
      clientDataJSON = new Uint8Array(rawData.clientDataJSON)
      authenticatorData = new Uint8Array(rawData.authenticatorData)
      signatureBytes = new Uint8Array(rawData.signature)
      expectedChallenge = signature.signedData.challenge
    }

    // Step 1: Verify the challenge matches
    // The challenge in clientDataJSON is base64url encoded (no padding)
    const clientDataStr = new TextDecoder().decode(clientDataJSON)
    const clientData = JSON.parse(clientDataStr)
    const signedChallenge = clientData.challenge

    if (typeof signedChallenge !== "string") {
      return { valid: false, error: "missing_challenge_in_client_data" }
    }

    // Encode the expected challenge as base64url (no padding) for comparison
    const expectedChallengeBase64Url = base64urlnopad.encode(expectedChallenge)

    if (signedChallenge !== expectedChallengeBase64Url) {
      return { valid: false, error: "challenge_mismatch" }
    }

    // Step 2: Extract raw signature from DER format (needed for P-256)
    const rawSignature = extractRawSignature(
      signatureBytes,
      credentialKey.curveType
    )

    // Step 3: Verify the cryptographic signature
    const isValid = await verifyWebAuthn({
      clientDataJSON,
      authenticatorData,
      signature: rawSignature,
      curveType: credentialKey.curveType,
      publicKey: credentialKey.publicKey,
    })

    if (!isValid) {
      return { valid: false, error: "signature_invalid" }
    }
    return { valid: true }
  } catch (error) {
    logger.error("WebAuthn verification error:", { error })
    return {
      valid: false,
      error: `webauthn_error: ${error instanceof Error ? error.message : "unknown"}`,
    }
  }
}

/**
 * Converts a base64 string to a Uint8Array.
 * Used to deserialize WebAuthn data from Server Actions.
 */
function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}

/**
 * TON Connect signature verification (signData protocol).
 * Verifies Ed25519 signature using the public key from the TON address.
 *
 * TON Connect signData format:
 * For text/binary payloads:
 *   0xffff || "ton-connect/sign-data/" || workchain (4 bytes) || address_hash (32 bytes) ||
 *   domain_len (4 bytes) || domain || timestamp (8 bytes) || payload
 */
async function verifyTonConnectSignature(
  signature: Extract<
    walletMessage_.WalletSignatureResult,
    { type: "TON_CONNECT" }
  >,
  userAddress: string
): Promise<ServerVerificationResult> {
  // The userAddress for TON is the hex-encoded public key
  // Import @ton/ton for address parsing
  const { Address } = await import("@ton/ton")

  const {
    signature: signatureBase64,
    timestamp,
    domain,
    payload,
    address: tonAddress,
  } = signature.signatureData

  // Decode the signature from base64
  const signatureBytes = Buffer.from(signatureBase64, "base64")

  // The userAddress is the hex-encoded public key
  // Convert it to bytes for Ed25519 verification
  let publicKeyBytes: Uint8Array
  try {
    publicKeyBytes = Buffer.from(userAddress, "hex")
    if (publicKeyBytes.length !== 32) {
      return { valid: false, error: "invalid_public_key_length" }
    }
  } catch {
    return { valid: false, error: "invalid_public_key_format" }
  }

  // Parse the TON address to get workchain and hash
  let workchain: number
  let addressHash: Buffer
  try {
    const addr = Address.parse(tonAddress)
    workchain = addr.workChain
    addressHash = addr.hash
  } catch {
    return { valid: false, error: "invalid_ton_address" }
  }

  // Build the message to verify according to TON Connect signData spec
  // 0xffff prefix (2 bytes)
  const prefixBytes = Buffer.from([0xff, 0xff])

  // "ton-connect/sign-data/" string
  const protocolPrefix = Buffer.from("ton-connect/sign-data/")

  // Workchain as 4-byte big-endian
  const workchainBuffer = Buffer.alloc(4)
  workchainBuffer.writeInt32BE(workchain, 0)

  // Domain length as 4-byte little-endian
  const domainLengthBuffer = Buffer.alloc(4)
  domainLengthBuffer.writeUInt32LE(domain.length, 0)
  const domainBuffer = Buffer.from(domain)

  // Timestamp as 8-byte little-endian
  const timestampBuffer = Buffer.alloc(8)
  timestampBuffer.writeBigUInt64LE(BigInt(timestamp), 0)

  // Payload (the text that was signed)
  let payloadBuffer: Buffer
  if (payload.type === "text") {
    payloadBuffer = Buffer.from(payload.text)
  } else if (payload.type === "binary") {
    payloadBuffer = Buffer.from(payload.bytes, "base64")
  } else {
    // Cell type requires special handling with TL-B schema
    return { valid: false, error: "unsupported_payload_type" }
  }

  // Concatenate all parts
  const messageToSign = Buffer.concat([
    prefixBytes,
    protocolPrefix,
    workchainBuffer,
    addressHash,
    domainLengthBuffer,
    domainBuffer,
    timestampBuffer,
    payloadBuffer,
  ])

  // Hash the message with SHA256
  const messageHash = sha256(messageToSign)

  // Verify the Ed25519 signature
  const isValid = sign.detached.verify(
    messageHash,
    signatureBytes,
    publicKeyBytes
  )

  if (!isValid) {
    return { valid: false, error: "signature_invalid" }
  }
  return { valid: true }
}

/**
 * Stellar SEP-53 signature verification.
 * Uses Ed25519 with SHA256 prefix.
 *
 * Note: signatureData may be serialized as base64 string from Server Actions.
 */
function verifyStellarSignature(
  signature: Extract<
    walletMessage_.WalletSignatureResult | SerializedWalletSignatureResult,
    { type: "STELLAR_SEP53" }
  >,
  userAddress: string
): ServerVerificationResult {
  // Convert Stellar address to public key bytes
  const keypair = Keypair.fromPublicKey(userAddress)
  const publicKeyBytes = keypair.rawPublicKey()

  // Handle serialized signature data (base64 string from Server Action)
  let signatureBytes: Uint8Array
  if (typeof signature.signatureData === "string") {
    signatureBytes = base64ToUint8Array(signature.signatureData)
  } else {
    signatureBytes = signature.signatureData
  }

  // Encode the message with prefix (per SEP-53 spec)
  const prefix = "Stellar Signed Message:\n"
  const prefixBytes = new TextEncoder().encode(prefix)
  const messageBytes = new TextEncoder().encode(signature.signedData.message)
  const signedMessageBase = new Uint8Array([...prefixBytes, ...messageBytes])

  // Hash the encoded message (SHA256 of signedMessageBase)
  const messageHash = sha256(signedMessageBase)

  const isValid = sign.detached.verify(
    messageHash,
    signatureBytes,
    publicKeyBytes
  )

  if (!isValid) {
    return { valid: false, error: "signature_invalid" }
  }
  return { valid: true }
}

/**
 * Tron signature verification using TronWeb.
 * Recovers the signer address from the signature and compares with claimed address.
 */
async function verifyTronSignature(
  signature: Extract<walletMessage_.WalletSignatureResult, { type: "TRON" }>,
  userAddress: string
): Promise<ServerVerificationResult> {
  const { TronWeb } = await import("tronweb")
  const { settings } = await import(
    "@src/components/DefuseSDK/constants/settings"
  )

  const tronWeb = new TronWeb({
    fullHost: settings.rpcUrls.tron,
  })

  const derivedAddress = await tronWeb.trx.verifyMessageV2(
    signature.signedData.message,
    signature.signatureData
  )

  if (derivedAddress !== userAddress) {
    return { valid: false, error: "address_mismatch" }
  }
  return { valid: true }
}
