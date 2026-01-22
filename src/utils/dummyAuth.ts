import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { SignJWT, decodeJwt } from "jose"
import { APP_AUTH_JWT_SECRET_KEY } from "./environment"

export const JWT_VERSION = 1

export type JWTPayload = {
  version: number
  auth_identifier: string
  auth_method: string
}

/**
 * Generates a JWT token for app authentication
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
    .setExpirationTime("30d") // Token expires in 30 days
    .sign(secret)

  return token
}

/**
 * Extracts accountId from Bearer token.
 * For test purposes, decodes JWT without verification and derives accountId from payload.
 */
export function getAccountIdFromToken(token: string): string | null {
  try {
    // Decode JWT without verification (test only)
    const decoded = decodeJwt<JWTPayload>(token)

    // Derive accountId from auth_identifier and auth_method
    if (decoded.auth_identifier && decoded.auth_method) {
      return authIdentity.authHandleToIntentsUserId(
        decoded.auth_identifier,
        decoded.auth_method as AuthMethod
      )
    }

    return null
  } catch {
    return null
  }
}
