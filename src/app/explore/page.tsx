import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"

import { LIST_TOKENS } from "@src/constants/tokens"
import { coinPricesApiClient } from "@src/utils/coinPricesApiClient"
import { parsePeriod } from "@src/utils/parsePeriod"
import { parsePriceData } from "@src/utils/parsePriceData"

import ExplorePage from "./ExplorePage"

export type TokenRowData = (UnifiedTokenInfo | BaseTokenInfo) & {
  price: number
  change: number
  mindshare: number
  marketCap: number
  volume: number
}

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

const Page = async ({ searchParams }: PageProps) => {
  const patchedTokenList: TokenRowData[] = LIST_TOKENS.map((token) => ({
    ...token,
    price: 0,
    change: 0,
    mindshare: 0,
    marketCap: 0,
    volume: 0,
  }))

  const resolvedSearchParams = await searchParams
  const period = resolvedSearchParams.period || "7d"

  const days = parsePeriod(period)

  const livePrices = await coinPricesApiClient.getPrices(
    LIST_TOKENS.map((token) => token.symbol).join(","),
    days
  )
  const liveMarketCaps = await coinPricesApiClient.getMarketCaps()
  const { prices, marketData } = parsePriceData(livePrices)

  for (const token of patchedTokenList) {
    const symbol = token.symbol as keyof typeof liveMarketCaps
    token.marketCap = Number(liveMarketCaps[symbol] || 0)
  }

  return (
    <ExplorePage
      patchedTokenList={patchedTokenList}
      prices={prices}
      marketData={marketData}
      period={period}
    />
  )
}

export default Page
