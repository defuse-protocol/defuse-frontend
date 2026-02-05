import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { SignJWT, decodeJwt, jwtVerify } from "jose"
import { APP_AUTH_JWT_SECRET_KEY } from "./environment"

export const JWT_VERSION = 1
export const JWT_EXPIRY_SECONDS = 7 * 24 * 60 * 60 // 7 days

const AUTH_METHODS: AuthMethod[] = [
  "near",
  "evm",
  "solana",
  "webauthn",
  "ton",
  "stellar",
  "tron",
]

export function isAuthMethod(value: unknown): value is AuthMethod {
  return typeof value === "string" && AUTH_METHODS.includes(value as AuthMethod)
}

export type JWTPayload = {
  version: number
  auth_identifier: string
  auth_method: AuthMethod
}

/**
 * Generates a JWT token for app authentication
 */
export async function generateAppAuthToken(
  authIdentifier: string,
  authMethod: AuthMethod
): Promise<string> {
  if (!APP_AUTH_JWT_SECRET_KEY) {
    throw new Error("APP_AUTH_JWT_SECRET_KEY is not configured")
  }

  const secret = new TextEncoder().encode(APP_AUTH_JWT_SECRET_KEY)

  const token = await new SignJWT({
    version: JWT_VERSION,
    auth_identifier: authIdentifier,
    auth_method: authMethod,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${JWT_EXPIRY_SECONDS}s`)
    .sign(secret)

  return token
}

/**
 * Verifies a JWT token and returns the payload if valid
 * Returns null if verification fails
 */
export async function verifyAppAuthToken(
  token: string
): Promise<JWTPayload | null> {
  if (!APP_AUTH_JWT_SECRET_KEY) {
    logger.error(
      "APP_AUTH_JWT_SECRET_KEY is not configured, skipping token verification"
    )
    return null
  }

  try {
    const secret = new TextEncoder().encode(APP_AUTH_JWT_SECRET_KEY)
    const { payload } = await jwtVerify(token, secret)

    // Validate payload structure
    if (
      typeof payload.auth_identifier !== "string" ||
      !isAuthMethod(payload.auth_method) ||
      typeof payload.version !== "number"
    ) {
      return null
    }

    return {
      version: payload.version,
      auth_identifier: payload.auth_identifier,
      auth_method: payload.auth_method,
    }
  } catch {
    return null
  }
}

/**
 * Extracts expiration timestamp from JWT token (in milliseconds)
 * Returns null if token is invalid or has no expiration
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const decoded = decodeJwt(token)
    if (decoded.exp) {
      // JWT exp is in seconds, convert to milliseconds
      return decoded.exp * 1000
    }
    return null
  } catch {
    return null
  }
}

/**
 * Extracts accountId from Bearer token.
 * Decodes JWT without verification and derives accountId from payload.
 */
export function getAccountIdFromToken(token: string): string | null {
  try {
    const decoded = decodeJwt(token)

    // Derive accountId from auth_identifier and auth_method
    if (
      typeof decoded.auth_identifier === "string" &&
      isAuthMethod(decoded.auth_method)
    ) {
      return authIdentity.authHandleToIntentsUserId(
        decoded.auth_identifier,
        decoded.auth_method
      )
    }

    return null
  } catch {
    return null
  }
}
