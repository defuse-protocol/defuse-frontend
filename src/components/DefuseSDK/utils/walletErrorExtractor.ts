export type WalletErrorCode =
  | "ERR_WALLET_POPUP_BLOCKED"
  | "ERR_WALLET_CANCEL_ACTION"

const walletErrorMapping: Record<string, Record<string, WalletErrorCode>> = {
  MeteorActionError: {
    "Couldn't open popup window to complete wallet action":
      "ERR_WALLET_POPUP_BLOCKED",
    "User cancelled the action": "ERR_WALLET_CANCEL_ACTION",
  },
}

/**
 * Extracts a standardized wallet error code from an error object
 * @param error - The error to analyze
 * @param fallback - Default value if no matching error code found
 * @returns Either a wallet error code or the fallback value
 */
export function extractWalletErrorCode<T>(
  error: unknown,
  fallback: T
): T | WalletErrorCode {
  if (error instanceof Error) {
    const code = walletErrorMapping[error.name]?.[error.message]
    if (code !== undefined) {
      return code
    }

    return extractWalletErrorCode(error.cause, fallback)
  }

  return fallback
}
