import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { LIST_TOKENS } from "@src/constants/tokens"

export const safeTokenList = filterTokenWithDifferentDecimals(LIST_TOKENS)

export function filterTokenWithDifferentDecimals(tokenList: TokenInfo[]) {
  return tokenList.filter((token) => {
    if (isBaseToken(token)) {
      return true
    }

    const decimals = token.groupedTokens.map((t) => t.decimals)
    return new Set(decimals).size === 1
  })
}
