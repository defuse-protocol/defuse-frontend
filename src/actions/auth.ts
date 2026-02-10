"use server"

import { createHash } from "node:crypto"
import type {
  MultiPayload,
  MultiPayloadNep413,
} from "@defuse-protocol/contract-types"
import {
  type AuthMethod,
  authIdentity,
  utils,
} from "@defuse-protocol/internal-utils"
import { base58 } from "@scure/base"
import { config } from "@src/components/DefuseSDK/config"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { hashing as nep413Hashing } from "@src/components/DefuseSDK/features/gift/utils/hashing"
import {
  JWT_EXPIRY_SECONDS,
  generateAppAuthToken,
  getTokenExpiration,
  verifyAppAuthToken,
} from "@src/utils/authJwt"
import { hasMessage } from "@src/utils/errors"
import { extractSignerFromIntent } from "@src/utils/extractSignerFromIntent"
import { logger } from "@src/utils/logger"
import type { CodeResult } from "near-api-js/lib/providers/provider"
import { cookies } from "next/headers"
import { sign as naclSign } from "tweetnacl"

const AUTH_TOKEN_COOKIE_PREFIX = "defuse_auth_"
const ACTIVE_SESSION_COOKIE_NAME = "defuse_active_token"
const COOKIE_MAX_AGE_SECONDS = JWT_EXPIRY_SECONDS

/**
 * Generates a deterministic cookie key for a given wallet address.
 *
 * Pattern: defuse_auth_{first 16 chars of SHA-256(address)}
 * Example: defuse_auth_306fbbbb32986e10
 *
 * Why we hash the address:
 * - Each wallet gets a unique cookie, enabling multi-wallet sessions
 * - The wallet address isn't exposed in the cookie name (privacy)
 * - Deterministic: same address always produces the same key
 * - 16 hex chars (64 bits) provides sufficient uniqueness while keeping keys short
 */
function getCookieKeyForAddress(address: string): string {
  const hashHex = createHash("sha256").update(address, "utf8").digest("hex")
  return `${AUTH_TOKEN_COOKIE_PREFIX}${hashHex.slice(0, 16)}`
}

/**
 * Set a wallet's auth token in an httpOnly cookie with address-based key.
 * Also sets the active session cookie (JWT copy) for server-side access.
 */
export async function setWalletToken(
  address: string,
  token: string
): Promise<void> {
  const cookieKey = getCookieKeyForAddress(address)
  const cookieStore = await cookies()

  cookieStore.set(cookieKey, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })

  cookieStore.set(ACTIVE_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })
}

/**
 * Get a wallet's auth token from its cookie
 */
export async function getWalletToken(address: string): Promise<string | null> {
  const cookieKey = getCookieKeyForAddress(address)
  const cookieStore = await cookies()
  return cookieStore.get(cookieKey)?.value ?? null
}

/**
 * Get the active session JWT from the active token cookie (for server-side use)
 */
export async function getActiveSessionToken(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_SESSION_COOKIE_NAME)?.value ?? null
}

/**
 * Clear only the active session cookie (on sign out).
 * Preserves per-wallet auth tokens so user can reconnect without re-verifying.
 */
export async function clearActiveWallet(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_SESSION_COOKIE_NAME)
}

export interface ValidateTokenForWalletResult {
  valid: boolean
  reason?:
    | "no_token"
    | "invalid_signature"
    | "address_mismatch"
    | "chain_mismatch"
}

/**
 * Validates JWT token for a wallet. Reads from cookie if token not provided.
 * Performs full cryptographic signature verification AND claims matching.
 *
 * @param expectedAddress - The wallet address that should match auth_identifier
 * @param expectedChainType - The chain type that should match auth_method
 */
export async function validateTokenForWallet(
  expectedAddress: string,
  expectedChainType: string
): Promise<ValidateTokenForWalletResult> {
  const token = await getWalletToken(expectedAddress)

  if (!token) {
    return { valid: false, reason: "no_token" }
  }

  const payload = await verifyAppAuthToken(token)
  if (!payload) {
    return { valid: false, reason: "invalid_signature" }
  }

  if (payload.auth_identifier !== expectedAddress) {
    return { valid: false, reason: "address_mismatch" }
  }

  if (payload.auth_method !== expectedChainType) {
    return { valid: false, reason: "chain_mismatch" }
  }

  // Set active session cookie (handles reconnect where per-wallet JWT exists but session cookie was cleared)
  const cookieStore = await cookies()
  cookieStore.set(ACTIVE_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })

  return { valid: true }
}

/**
 * Compares signer from message with expected signer for auth.
 * For Tron, normalizes both to 0x+40 hex lowercase so base58 vs hex or case differences still match.
 * For Stellar, normalizes to lowercase (signer_id is hex without 0x prefix).
 */
function isSignerMatchForAuth(
  signerFromMessage: string | null,
  expectedSigner: string,
  authMethod: AuthMethod
): boolean {
  if (signerFromMessage == null) return false
  if (authMethod === "tron") {
    const canonicalExpected = expectedSigner.toLowerCase()
    let canonicalFromMessage: string
    if (signerFromMessage.startsWith("T")) {
      try {
        canonicalFromMessage = authIdentity
          .authHandleToIntentsUserId(signerFromMessage, "tron")
          .toLowerCase()
      } catch {
        return false
      }
    } else {
      canonicalFromMessage = signerFromMessage.toLowerCase()
    }
    return canonicalFromMessage === canonicalExpected
  }
  if (authMethod === "stellar") {
    return signerFromMessage.toLowerCase() === expectedSigner.toLowerCase()
  }
  return signerFromMessage === expectedSigner
}

export interface GenerateAuthTokenFromSignatureInput {
  /** Signed intent in MultiPayload format (JSON-safe output from formatSignedIntent) */
  signedIntent: MultiPayload
  address: string
  authMethod: AuthMethod
}

export interface GenerateAuthTokenFromSignatureResult {
  success: boolean
  /** Only present on success; JWT is set in httpOnly cookie, not returned */
  expiresAt?: number
  error?: "signature_invalid" | "message_expired" | "token_generation_failed"
}

/**
 * Verifies a signed intent via NEAR RPC `simulate_intents` and generates JWT token.
 *
 * This uses the contract's own verification logic (source of truth) instead of
 * performing per-chain crypto verification locally. The contract handles:
 * - Signature verification for all supported chains (EVM, Solana, WebAuthn, TON, Stellar, TRON)
 * - Deadline verification (replay protection)
 * - Address/credential validation
 */
export async function generateAuthTokenFromWalletSignature(
  input: GenerateAuthTokenFromSignatureInput
): Promise<GenerateAuthTokenFromSignatureResult> {
  try {
    const { signedIntent, address, authMethod } = input

    // Security: verify signer_id in message matches the claimed address/authMethod
    // This prevents attacks where someone submits a valid signature but claims a different address
    const signerFromMessage = extractSignerFromIntent(signedIntent)
    const expectedSigner = authIdentity.authHandleToIntentsUserId(
      address,
      authMethod
    )
    const signerMatch = isSignerMatchForAuth(
      signerFromMessage,
      expectedSigner,
      authMethod
    )
    if (!signerMatch) {
      logger.warn("Signer mismatch in auth request", {
        signerFromMessage,
        expectedSigner,
      })
      return { success: false, error: "signature_invalid" }
    }

    const isValid = await verifyViaSimulateIntents(signedIntent)

    if (!isValid) {
      return { success: false, error: "signature_invalid" }
    }

    const token = await generateAppAuthToken(address, authMethod)
    const expiresAt = getTokenExpiration(token)

    if (!expiresAt) {
      return { success: false, error: "token_generation_failed" }
    }

    // Set cookie server-side only; never return JWT to client (cookie-only auth)
    await setWalletToken(address, token)

    return { success: true, expiresAt }
  } catch (err) {
    logger.error("Auth token generation failed", {
      error: err,
    })
    return { success: false, error: "signature_invalid" }
  }
}

const ED25519_PREFIX = "ed25519:"
const NONCE_LENGTH = 32
const ED25519_PUBLIC_KEY_LENGTH = 32
const ED25519_SIGNATURE_LENGTH = 64

/**
 * Verifies a NEP-413 signed intent by recomputing the message hash (per NEP-413
 * Borsh serialization) and checking the Ed25519 signature. The NEAR contract
 * cannot verify NEP-413 without key registration, so we do full crypto verification here.
 */
async function verifyNep413Signature(
  signedIntent: MultiPayloadNep413
): Promise<boolean> {
  try {
    const {
      payload,
      public_key: publicKeyStr,
      signature: signatureStr,
    } = signedIntent

    const parsed = JSON.parse(payload.message)
    if (!parsed.signer_id) return false
    if (parsed.deadline) {
      const deadlineMs = Date.parse(parsed.deadline)
      if (Number.isNaN(deadlineMs) || Date.now() > deadlineMs) return false
    }

    const nonceBytes = Buffer.from(payload.nonce, "base64")
    if (nonceBytes.length !== NONCE_LENGTH) return false

    const messageHash = await nep413Hashing({
      message: payload.message,
      recipient: payload.recipient,
      nonce: new Uint8Array(nonceBytes),
    })

    if (
      !publicKeyStr.startsWith(ED25519_PREFIX) ||
      !signatureStr.startsWith(ED25519_PREFIX)
    ) {
      return false
    }
    const publicKeyBytes = base58.decode(
      publicKeyStr.slice(ED25519_PREFIX.length)
    )
    const signatureBytes = base58.decode(
      signatureStr.slice(ED25519_PREFIX.length)
    )
    if (
      publicKeyBytes.length !== ED25519_PUBLIC_KEY_LENGTH ||
      signatureBytes.length !== ED25519_SIGNATURE_LENGTH
    ) {
      return false
    }

    const signatureValid = naclSign.detached.verify(
      messageHash,
      signatureBytes,
      publicKeyBytes
    )
    if (!signatureValid) {
      return false
    }

    // Security: Verify the public key is authorized for the claimed account.
    // Without this check, an attacker could sign a message claiming any signer_id
    // with their own keypair and bypass authentication.
    const accountId = parsed.signer_id as string

    if (utils.isImplicitAccount(accountId)) {
      // For implicit accounts, the account ID IS the hex-encoded public key
      const publicKeyHex = Buffer.from(publicKeyBytes).toString("hex")
      if (accountId !== publicKeyHex) {
        return false
      }
    } else {
      // For named accounts, verify the public key is registered on-chain
      try {
        await nearClient.query({
          request_type: "view_access_key",
          account_id: accountId,
          public_key: publicKeyStr,
          finality: "optimistic",
        })
      } catch {
        // Key not found for this account or RPC error
        return false
      }
    }

    return true
  } catch {
    return false
  }
}

/**
 * Verifies a signed intent using the NEAR contract's simulate_intents RPC call.
 * For NEP-413 (NEAR native), the contract cannot verify without key registration,
 * so we perform full Ed25519 signature verification server-side instead.
 */
async function verifyViaSimulateIntents(
  signedIntent: MultiPayload
): Promise<boolean> {
  if (signedIntent.standard === "nep413") {
    return verifyNep413Signature(signedIntent)
  }

  try {
    const argsJson = JSON.stringify({ signed: [signedIntent] })
    const argsBase64 =
      typeof btoa !== "undefined"
        ? btoa(argsJson)
        : Buffer.from(argsJson).toString("base64")

    await nearClient.query<CodeResult>({
      request_type: "call_function",
      account_id: config.env.contractID,
      method_name: "simulate_intents",
      args_base64: argsBase64,
      finality: "optimistic",
    })

    return true
  } catch (err) {
    if (hasMessage(err, "invalid signature")) {
      return false
    }
    if (hasMessage(err, "Signature verification failed")) {
      return false
    }
    throw err
  }
}
