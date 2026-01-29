import { LIST_TOKENS } from "@src/constants/tokens"
import { useMemo } from "react"

/**
 * Hook that provides filtered token lists for Earn operations.
 * Returns the smUSDC token and selectable tokens (excluding earn-only tokens).
 */
export function useEarnTokenList() {
  const smUsdcToken = useMemo(() => {
    return LIST_TOKENS.find(
      (token) =>
        "tags" in token &&
        token.tags?.includes("category:earn-only") &&
        token.symbol === "smUSDC"
    )
  }, [])

  const selectableTokens = useMemo(() => {
    return LIST_TOKENS.filter((token) => {
      if ("tags" in token && token.tags?.includes("category:earn-only")) {
        return false
      }
      return true
    })
  }, [])

  return { smUsdcToken, selectableTokens }
}
