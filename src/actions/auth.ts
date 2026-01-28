"use server"

import type { AuthMethod } from "@defuse-protocol/internal-utils"
import {
  JWT_EXPIRY_SECONDS,
  generateAppAuthToken,
  getTokenExpiration,
  verifyAppAuthToken,
} from "@src/utils/authJwt"
import { cookies } from "next/headers"

const AUTH_TOKEN_COOKIE_NAME = "defuse_auth_token"
const COOKIE_MAX_AGE_SECONDS = JWT_EXPIRY_SECONDS

export interface GenerateAuthTokenResult {
  token: string
  expiresAt: number
}

/**
 * Generate JWT token and return it with expiration timestamp
 */
export async function generateAuthToken(
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
