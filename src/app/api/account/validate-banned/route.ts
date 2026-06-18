import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { isAccountBanned } from "@src/services/bannedAccounts"
import { logger } from "@src/utils/logger"

export const dynamic = "force-dynamic"

/**
 * Checks if an account (specified by address and chain type) is banned.
 *
 * Banned account intent IDs are stored as a JSON array under the Edge Config key
 * `bannedAccountIds`, and managed via the Vercel Edge Config dashboard.
 * Requires providing the `EDGE_CONFIG` environment variable (connection string).
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
    const authMethod = chainType as AuthMethod

    const accountId = authIdentity.authHandleToIntentsUserId(
      address,
      authMethod
    )

    const isBanned = accountId != null && (await isAccountBanned(accountId))

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
