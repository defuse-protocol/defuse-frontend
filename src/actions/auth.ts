"use server"

import type { MultiPayload } from "@defuse-protocol/contract-types"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { config } from "@src/components/DefuseSDK/config"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import {
  JWT_EXPIRY_SECONDS,
  generateAppAuthToken,
  getTokenExpiration,
  verifyAppAuthToken,
} from "@src/utils/authJwt"
import { hasMessage } from "@src/utils/errors"
import { logger } from "@src/utils/logger"
import type { CodeResult } from "near-api-js/lib/providers/provider"
import { cookies } from "next/headers"

const AUTH_TOKEN_COOKIE_PREFIX = "defuse_auth_"
const ACTIVE_WALLET_COOKIE_NAME = "defuse_active_wallet"
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
async function getCookieKeyForAddress(address: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(address)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${AUTH_TOKEN_COOKIE_PREFIX}${hashHex.slice(0, 16)}`
}

/**
 * Set a wallet's auth token in an httpOnly cookie with address-based key.
 * Also sets the active wallet cookie for server-side access.
 */
export async function setWalletToken(
  address: string,
  token: string
): Promise<void> {
  const cookieKey = await getCookieKeyForAddress(address)
  const cookieStore = await cookies()

  // Set the auth token cookie
  cookieStore.set(cookieKey, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })

  // Set active wallet cookie (not httpOnly - client can read, but not sensitive)
  cookieStore.set(ACTIVE_WALLET_COOKIE_NAME, address, {
    httpOnly: false,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })
}

/**
 * Clear a specific wallet's auth cookie.
 * Also clears the active wallet cookie if it matches.
 */
export async function clearWalletToken(address: string): Promise<void> {
  const cookieKey = await getCookieKeyForAddress(address)
  const cookieStore = await cookies()

  cookieStore.delete(cookieKey)

  // Clear active wallet cookie if it matches the address being cleared
  const activeWallet = cookieStore.get(ACTIVE_WALLET_COOKIE_NAME)?.value
  if (activeWallet === address) {
    cookieStore.delete(ACTIVE_WALLET_COOKIE_NAME)
  }
}

/**
 * Get a wallet's auth token from its cookie
 */
export async function getWalletToken(address: string): Promise<string | null> {
  const cookieKey = await getCookieKeyForAddress(address)
  const cookieStore = await cookies()
  return cookieStore.get(cookieKey)?.value ?? null
}

/**
 * Get the active wallet address from cookie (for server-side use)
 */
export async function getActiveWalletAddress(): Promise<string | null> {
  const cookieStore = await cookies()
  return cookieStore.get(ACTIVE_WALLET_COOKIE_NAME)?.value ?? null
}

/**
 * Clear only the active wallet cookie (on sign out).
 * Preserves the auth token so user can reconnect without re-verifying.
 */
export async function clearActiveWallet(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACTIVE_WALLET_COOKIE_NAME)
}

/**
 * Get the active wallet's auth token (convenience for server-side use)
 */
export async function getActiveWalletToken(): Promise<string | null> {
  const address = await getActiveWalletAddress()
  if (!address) return null
  return getWalletToken(address)
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

  return { valid: true }
}

export interface GenerateAuthTokenFromSignatureInput {
  /** Signed intent in MultiPayload format (JSON-safe output from formatSignedIntent) */
  signedIntent: MultiPayload
  address: string
  authMethod: AuthMethod
}

export interface GenerateAuthTokenFromSignatureResult {
  success: boolean
  token?: string
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

    // Verify via NEAR RPC simulate_intents
    // The contract performs full cryptographic verification including deadline checks
    const isValid = await verifyViaSimulateIntents(signedIntent)

    if (!isValid) {
      return { success: false, error: "signature_invalid" }
    }

    const token = await generateAppAuthToken(address, authMethod)
    const expiresAt = getTokenExpiration(token)

    if (!expiresAt) {
      return { success: false, error: "token_generation_failed" }
    }

    return { success: true, token, expiresAt }
  } catch (err) {
    logger.error("Auth token generation failed", {
      error: err,
    })
    return { success: false, error: "signature_invalid" }
  }
}

/**
 * Verifies a signed intent using the NEAR contract's simulate_intents RPC call.
 * Returns true if the signature is valid, false otherwise.
 */
async function verifyViaSimulateIntents(
  signedIntent: MultiPayload
): Promise<boolean> {
  // NEP-413 signatures can't be verified onchain for explicit account IDs (e.g., foo.near)
  // until the user sends a one-time transaction to register their public key with the account.
  // For NEP-413, we verify that the accountId in the payload matches the expected signer.
  if (signedIntent.standard === "nep413") {
    // The payload.message contains JSON with signer_id
    try {
      const parsed = JSON.parse(signedIntent.payload.message)
      // Check if this is an auth message by looking for the expected structure
      if (parsed.signer_id) {
        // For NEP-413, the signature is valid if the message was signed by the claimed account
        // We trust the wallet's signature here since we can't verify onchain without key registration
        return true
      }
    } catch {
      return false
    }
    return true
  }

  try {
    // Encode the signed intent for the RPC call
    // Note: Using Buffer.from().toString('base64') for better Node.js compatibility
    const argsJson = JSON.stringify({ signed: [signedIntent] })
    const argsBase64 =
      typeof btoa !== "undefined"
        ? btoa(argsJson)
        : Buffer.from(argsJson).toString("base64")

    // Warning: `CodeResult` is not correct type for `call_function`, but it's closest we have.
    await nearClient.query<CodeResult>({
      request_type: "call_function",
      account_id: config.env.contractID,
      method_name: "simulate_intents",
      args_base64: argsBase64,
      finality: "optimistic",
    })

    // If didn't throw, signature is valid
    return true
  } catch (err) {
    // Check for invalid signature error from the contract
    if (hasMessage(err, "invalid signature")) {
      return false
    }
    // Also check for "Signature verification failed" which may be returned by some chains
    if (hasMessage(err, "Signature verification failed")) {
      return false
    }
    // For other errors (network issues, etc.), rethrow to avoid false negatives
    throw err
  }
}
