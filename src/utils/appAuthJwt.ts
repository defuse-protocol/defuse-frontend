import { APP_AUTH_JWT_SECRET_KEY } from "@src/utils/environment"
import { SignJWT, jwtVerify } from "jose"
import { z } from "zod"

export const jwtPayloadSchema = z.object({
  version: z.string(),
  auth_identifier: z.string(),
  auth_method: z.string(),
})

export type JWTPayload = z.infer<typeof jwtPayloadSchema>

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
    version: "1.0",
    auth_identifier: authIdentifier,
    auth_method: authMethod,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // Token expires in 7 days
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
