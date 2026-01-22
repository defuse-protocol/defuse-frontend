import { APP_AUTH_JWT_SECRET_KEY } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { SignJWT, jwtVerify } from "jose"
import { z } from "zod"

if (!APP_AUTH_JWT_SECRET_KEY) {
  logger.warn(
    "APP_AUTH_JWT_SECRET_KEY is not set. JWT tokens will not be secure. Please set APP_AUTH_JWT_SECRET_KEY in your environment variables."
  )
}

const JWT_VERSION = "1.0"

export const jwtPayloadSchema = z.object({
  version: z.string(),
  auth_identifier: z.string(),
  auth_method: z.string(),
})

export type JWTPayload = z.infer<typeof jwtPayloadSchema>

const TOKEN_STORAGE_KEY = "defuse_auth_token"

/**
 * Generates an app auth token (JWT) with authentication information
 * SERVER-SIDE ONLY - Never call this from client code
 * @param authIdentifier - The wallet address
 * @param authMethod - The chain type (e.g., "evm", "near", "solana")
 * @returns The app auth token as a string
 */
export async function generateAppAuthToken(
  authIdentifier: string,
  authMethod: string
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
    .setExpirationTime("1m") // Token expires in 1 minutes
    .sign(secret)

  return token
}

/**
 * Verifies and decodes a JWT token
 * @param token - The JWT token to verify
 * @returns The decoded payload if valid, null otherwise
 */
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  if (!APP_AUTH_JWT_SECRET_KEY) {
    return null
  }

  try {
    const secret = new TextEncoder().encode(APP_AUTH_JWT_SECRET_KEY)
    const { payload } = await jwtVerify(token, secret)

    // Validate payload structure matches JWTPayload schema
    const validatedPayload = jwtPayloadSchema.safeParse(payload)

    if (!validatedPayload.success) {
      return null
    }

    return validatedPayload.data
  } catch {
    // JWT verification failed - return null to indicate invalid token
    return null
  }
}

/**
 * Gets the stored JWT token from localStorage
 * @returns The stored token or null if not found
 */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") {
    return null
  }
  return localStorage.getItem(TOKEN_STORAGE_KEY)
}

/**
 * Stores the app auth token in localStorage
 */
export function storeAppAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
  }
}

/**
 * Removes the app auth token from storage
 */
export function removeAppAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
  }
}

/**
 * Gets the Bearer token string for use in Authorization headers
 * @returns Bearer token string or null if no token is stored
 */
export function getBearerToken(): string | null {
  const token = getStoredToken()
  return token ? `Bearer ${token}` : null
}
