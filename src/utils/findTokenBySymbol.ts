import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"
import { isBaseToken } from "@defuse-protocol/defuse-sdk/utils"

import { LIST_TOKENS } from "@src/constants/tokens"

type TokenWithTags =
  | (BaseTokenInfo & { tags?: string[] })
  | (UnifiedTokenInfo & { tags?: string[] })

export function findTokenBySymbol(
  symbol: string | null,
  defaultToken: TokenWithTags | undefined
): TokenWithTags | undefined {
  if (!symbol) return defaultToken

  return (
    LIST_TOKENS.find((token) => {
      if (isBaseToken(token)) {
        return token.symbol.toLowerCase() === symbol.toLowerCase()
      }
      return token.groupedTokens.some(
        (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
      )
    }) || defaultToken
  )
}
