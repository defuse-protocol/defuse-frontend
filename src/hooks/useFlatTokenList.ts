import { isBaseToken } from "@src/components/DefuseSDK/utils"
import type { TokenWithTags } from "@src/constants/tokens"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useIs1CsEnabled } from "./useIs1CsEnabled"

export function useFlatTokenList(tokenList: TokenWithTags[]) {
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")
  const is1cs = useIs1CsEnabled()

  return useMemo(() => {
    if (flatListIsEnabled || is1cs) {
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
  }, [flatListIsEnabled, is1cs, tokenList])
}
