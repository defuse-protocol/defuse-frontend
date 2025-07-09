import type { TokenRowData } from "@src/app/explore/page"
import type { SimpleMarketData } from "@src/utils/coinPricesApiClient"

const IGNORED_TOKENS = ["gnear", "noer"]

export const prepareExplorePageTokens = (
  patchedTokenList: TokenRowData[],
  marketData: Record<string, SimpleMarketData>,
  search: string
) => {
  return patchedTokenList
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((token) => !IGNORED_TOKENS.includes(token.symbol.toLowerCase()))
    .filter((token) => marketData[token.symbol])
    .sort((a, b) => {
      const aMarketCap = a.marketCap ?? 0
      const bMarketCap = b.marketCap ?? 0
      return bMarketCap - aMarketCap
    })
}
