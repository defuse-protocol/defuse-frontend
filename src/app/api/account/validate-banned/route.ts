import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { BANNED_ACCOUNT_IDS } from "@src/utils/environment"
import { logger } from "@src/utils/logger"

export const dynamic = "force-dynamic"

/**
 * Validates if an account is banned based on address and chain type.
 * Currently uses environment variable (BANNED_ACCOUNT_IDS) from Vercel.
 * This can be later substituted with an external API call.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const address = searchParams.get("address")
  const chainType = searchParams.get("chainType")

  if (!address || !chainType) {
    return Response.json(
      { error: "Missing address or chainType parameter" },
      { status: 400 }
    )
  }

  try {
    // Map chainType string to AuthMethod enum
    // ChainType enum values match AuthMethod values: "near", "evm", "solana", etc.
    const authMethod = chainType as AuthMethod

    const accountId = authIdentity.authHandleToIntentsUserId(
      address,
      authMethod
    )

    // Check against banned account IDs from environment variable
    // TODO: Replace with external API call when available
    const isBanned = accountId != null && BANNED_ACCOUNT_IDS.includes(accountId)

    return Response.json({
      isBanned,
      accountId: accountId ?? null,
    })
  } catch (error) {
    logger.error("Error validating banned account:", {
      error,
      address,
      chainType,
    })
    return Response.json(
      { error: "Failed to validate account" },
      { status: 500 }
    )
  }
}
