import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { verifyJWT } from "@src/utils/jwt"
import { logger } from "@src/utils/logger"

/**
 * Validates a JWT token and extracts the account_id from the token payload
 * @param token - The JWT token string (without "Bearer " prefix)
 * @returns The account_id derived from the token payload, or null if invalid
 */
export async function getAccountIdFromToken(
  token: string
): Promise<string | null> {
  try {
    const payload = await verifyJWT(token)

    if (!payload) {
      return null
    }

    const { auth_identifier, auth_method } = payload

    if (!auth_identifier || !auth_method) {
      return null
    }

    const account_id = authIdentity.authHandleToIntentsUserId(
      auth_identifier,
      auth_method as AuthMethod
    )

    return account_id
  } catch (error) {
    logger.error("Failed to extract account_id from token", { error })
    return null
  }
}
