import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"

import { LIST_TOKENS } from "@src/constants/tokens"
import {
  coinPricesApiClient,
  getDaysFromPeriod,
} from "@src/utils/coinPricesApiClient"

import ExplorePage from "./ExplorePage"

export type TokenRowData = (UnifiedTokenInfo | BaseTokenInfo) & {
  price: number
  change: number
  mindshare: number
  marketCap: number
  volume: number
}

export interface SimpleMarketData {
  prices: number[]
  market_caps: number[]
  total_volumes: number[]
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

  const days = getDaysFromPeriod(period)

  // Get prices for all tokens for the specified period
  const livePrices = await coinPricesApiClient.getPrices(
    LIST_TOKENS.map((token) => token.symbol).join(","),
    days
  )

  const liveMarketCaps = await coinPricesApiClient.getMarketCaps()

  // Process prices to match the expected format
  const prices: Record<string, number> = {}
  const marketData: Record<string, SimpleMarketData> = {}

  for (const [symbol, priceData] of Object.entries(livePrices)) {
    if (priceData && priceData.length > 0) {
      // Get the latest price (last in the array)
      const latestPrice = priceData[priceData.length - 1][1]
      prices[symbol] = latestPrice

      // Create market data structure for charts
      const priceValues = priceData.map(([, price]: [string, number]) => price)
      const marketCapValues = priceValues.map(() =>
        Number(liveMarketCaps[symbol as keyof typeof liveMarketCaps] || 0)
      ) // Use actual market cap
      const volumeValues = priceValues.map(() => 0) // Placeholder for volume

      marketData[symbol] = {
        prices: priceValues,
        market_caps: marketCapValues,
        total_volumes: volumeValues,
      }
    }
  }

  // Also update the token list for consistency
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
