"use server"

import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { verifyWalletSignature as verifyWalletSignatureLocal } from "@src/components/DefuseSDK/utils/verifyWalletSignature"
import {
  JWT_EXPIRY_SECONDS,
  generateAppAuthToken,
  getTokenExpiration,
  verifyAppAuthToken,
} from "@src/utils/authJwt"
import { cookies } from "next/headers"

const AUTH_TOKEN_COOKIE_NAME = "defuse_auth_token"
const AUTH_CHALLENGE_COOKIE_NAME = "defuse_auth_challenge"
const COOKIE_MAX_AGE_SECONDS = JWT_EXPIRY_SECONDS
const CHALLENGE_MAX_AGE_SECONDS = 5 * 60 // 5 minutes

async function isSecureCookie(): Promise<boolean> {
  const vercelEnv = process.env.VERCEL_ENV
  if (vercelEnv === "production" || vercelEnv === "preview") {
    return true
  }
  return false
}

export interface GenerateAuthTokenResult {
  token: string
  expiresAt: number
}

/**
 * Generate JWT token and return it with expiration timestamp
 */
async function generateAuthTokenInternal(
  authIdentifier: string,
  authMethod: AuthMethod
): Promise<GenerateAuthTokenResult> {
  const token = await generateAppAuthToken(authIdentifier, authMethod)
  const expiresAt = getTokenExpiration(token)

  if (!expiresAt) {
    throw new Error("Failed to extract token expiration")
  }

  return { token, expiresAt }
}

/**
 * Set the active wallet token in an httpOnly cookie
 */
export async function setActiveWalletToken(token: string): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.set(AUTH_TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: await isSecureCookie(),
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

export interface CreateWalletAuthChallengeResult {
  nonce: string
  expiresAt: number
}

/**
 * Creates a short-lived, httpOnly nonce challenge bound to address+chainType.
 * The nonce is stored server-side in a cookie to prevent arbitrary token minting.
 */
export async function createWalletAuthChallenge(
  expectedAddress: string,
  expectedChainType: AuthMethod
): Promise<CreateWalletAuthChallengeResult> {
  const cookieStore = await cookies()

  const nonceBytes = crypto.getRandomValues(new Uint8Array(16))
  const nonce = Buffer.from(nonceBytes).toString("base64")

  const expiresAt = Date.now() + CHALLENGE_MAX_AGE_SECONDS * 1000

  cookieStore.set(
    AUTH_CHALLENGE_COOKIE_NAME,
    JSON.stringify({
      nonce,
      expectedAddress,
      expectedChainType,
      expiresAt,
    }),
    {
      httpOnly: true,
      secure: await isSecureCookie(),
      sameSite: "lax",
      maxAge: CHALLENGE_MAX_AGE_SECONDS,
      path: "/",
    }
  )

  return { nonce, expiresAt }
}

export interface GenerateAuthTokenFromSignatureResult
  extends GenerateAuthTokenResult {}

/**
 * Verifies wallet ownership server-side (nonce challenge + signature) then mints a JWT.
 * This prevents minting tokens for arbitrary addresses from the client.
 */
export async function generateAuthTokenFromWalletSignature(
  expectedAddress: string,
  expectedChainType: AuthMethod,
  signature: walletMessage.WalletSignatureResult
): Promise<GenerateAuthTokenFromSignatureResult> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(AUTH_CHALLENGE_COOKIE_NAME)?.value

  if (!raw) {
    throw new Error("Missing auth challenge")
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME)
    throw new Error("Invalid auth challenge")
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("nonce" in parsed) ||
    !("expectedAddress" in parsed) ||
    !("expectedChainType" in parsed) ||
    !("expiresAt" in parsed)
  ) {
    cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME)
    throw new Error("Invalid auth challenge")
  }

  const challenge = parsed as {
    nonce: string
    expectedAddress: string
    expectedChainType: AuthMethod
    expiresAt: number
  }

  if (
    challenge.expectedAddress !== expectedAddress ||
    challenge.expectedChainType !== expectedChainType
  ) {
    cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME)
    throw new Error("Auth challenge mismatch")
  }

  if (Date.now() >= challenge.expiresAt) {
    cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME)
    throw new Error("Auth challenge expired")
  }

  // One-time use (prevents replays within the same browser session).
  cookieStore.delete(AUTH_CHALLENGE_COOKIE_NAME)

  const signatureOk = await verifyWalletSignatureLocal(
    signature,
    expectedAddress
  )
  if (!signatureOk) {
    throw new Error("Invalid wallet signature")
  }

  return await generateAuthTokenInternal(expectedAddress, expectedChainType)
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
