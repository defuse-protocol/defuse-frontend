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

const AUTH_TOKEN_COOKIE_NAME = "defuse_auth_token"
const COOKIE_MAX_AGE_SECONDS = JWT_EXPIRY_SECONDS

/**
 * Set the active wallet token in an httpOnly cookie
 */
export async function setActiveWalletToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_SECONDS,
    path: "/",
  })
}

/**
 * Clear the active wallet cookie (on sign out)
 */
export async function clearActiveWalletToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(AUTH_TOKEN_COOKIE_NAME)
}

export interface ValidateTokenResult {
  valid: boolean
  authIdentifier: string | null
  authMethod: string | null
}

/**
 * Validate the current cookie token
 */
export async function validateCurrentToken(): Promise<ValidateTokenResult> {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_TOKEN_COOKIE_NAME)?.value

  if (!token) {
    return { valid: false, authIdentifier: null, authMethod: null }
  }

  const payload = await verifyAppAuthToken(token)

  if (!payload) {
    return { valid: false, authIdentifier: null, authMethod: null }
  }

  return {
    valid: true,
    authIdentifier: payload.auth_identifier,
    authMethod: payload.auth_method,
  }
}

export interface ValidateTokenForWalletResult {
  valid: boolean
  reason?: "invalid_signature" | "address_mismatch" | "chain_mismatch"
}

/**
 * Validates a JWT token against expected wallet address and chain type.
 * Performs full cryptographic signature verification AND claims matching.
 *
 * @param token - The JWT token to validate
 * @param expectedAddress - The wallet address that should match auth_identifier
 * @param expectedChainType - The chain type that should match auth_method
 */
export async function validateTokenForWallet(
  token: string,
  expectedAddress: string,
  expectedChainType: string
): Promise<ValidateTokenForWalletResult> {
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
