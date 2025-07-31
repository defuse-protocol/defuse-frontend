import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useFlatTokenList(
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
) {
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
