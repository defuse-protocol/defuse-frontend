import { isBaseToken } from "@src/components/DefuseSDK/utils"
import type { TokenWithTags } from "@src/constants/tokens"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useFlatTokenList(tokenList: TokenWithTags[]) {
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")

  return useMemo(() => {
    if (flatListIsEnabled) {
      return tokenList
        .flatMap((token) =>
          isBaseToken(token) ? [token] : token.groupedTokens
        )
        .map((token) => ({
          ...token,
          symbol: `${token.symbol} (${token.chainName})`,
        }))
    }
    return tokenList
  }, [flatListIsEnabled, tokenList])
}
