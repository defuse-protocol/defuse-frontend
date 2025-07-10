import type { TokenRowData } from "@src/app/explore/page"

const IGNORED_TOKENS = ["gnear", "noer"]

export const prepareExplorePageTokens = (
  patchedTokenList: TokenRowData[],
  search: string
): TokenRowData[] => {
  return patchedTokenList
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((token) => !IGNORED_TOKENS.includes(token.symbol.toLowerCase()))
    .sort((a, b) => {
      const aMarketCap = a.marketCap ?? 0
      const bMarketCap = b.marketCap ?? 0
      return bMarketCap - aMarketCap
    })
}
