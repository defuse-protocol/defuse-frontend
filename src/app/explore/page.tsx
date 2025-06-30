import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"

import { LIST_TOKENS } from "@src/constants/tokens"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"

import { coinGeckoApiClient } from "@src/utils/coinGeckoApiClient"
import ExplorePage from "./ExplorePage"

export type TokenRowData = (UnifiedTokenInfo | BaseTokenInfo) & {
  price: number
  change: number
  mindshare: number
  marketCap: number
  volume: number
}

// Type for our API response
type TokenPriceData = {
  latestPrice: number | null
  priceChange: number | null
  priceChangePercent: number | null
  history: Array<{
    price: number
    timestamp: string
  }>
}

// Mock MarketDataReturnType to maintain compatibility
type MockMarketDataReturnType = {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

const Page = async () => {
  const patchedTokenList: TokenRowData[] = LIST_TOKENS.map((token) => ({
    ...token,
    price: 0,
    change: 0,
    mindshare: 0,
    marketCap: 0,
    volume: 0,
  }))

  // Get all supported token symbols
  const supportedSymbols = patchedTokenList
    .map((token) => token.symbol.toUpperCase())
    .filter((symbol) =>
      Object.keys(coinGeckoIdBySymbol).includes(symbol.toLowerCase())
    )

  // Fetch fresh token prices from CoinGecko
  try {
    const result = await coinGeckoApiClient.getUsdPrice(
      supportedSymbols.join(",")
    )
    for (const [symbol, price] of Object.entries(result)) {
      const patchedToken = patchedTokenList.find((t) => t.symbol === symbol)
      if (patchedToken) {
        patchedToken.marketCap = price.usd
      }
    }
  } catch (error) {
    console.error("Failed to fetch prices from CoinGecko:", error)
  }

  // Fetch data from our API endpoint
  let tokenPricesData: Record<string, TokenPriceData> = {}
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/token-prices?symbols=${supportedSymbols.join(",")}&days=7`,
      { cache: "no-store" }
    )

    if (response.ok) {
      const result = await response.json()
      if (result.success) {
        tokenPricesData = result.data
      }
    }
  } catch (error) {
    console.error("Failed to fetch token prices from API:", error)
  }

  // Convert our API data to the expected format
  const prices: Record<string, number> = {}
  const marketData: Record<string, MockMarketDataReturnType> = {}

  for (const [symbol, data] of Object.entries(tokenPricesData)) {
    if (data.latestPrice !== null) {
      // Store price using the CoinGecko ID as key for compatibility
      const coinGeckoId =
        coinGeckoIdBySymbol[symbol.toLowerCase() as CoinGeckoId]
      if (coinGeckoId) {
        prices[coinGeckoId] = data.latestPrice

        // Convert history to the expected format for charts
        const pricesArray: [number, number][] = data.history.map((entry) => [
          new Date(entry.timestamp).getTime(), // timestamp
          entry.price, // price
        ])

        // Mock market cap data (we don't have this from our API yet)
        const marketCapsArray: [number, number][] = data.history.map(
          (entry) => [
            new Date(entry.timestamp).getTime(),
            0, // placeholder for market cap
          ]
        )

        // Mock volume data (we don't have this from our API yet)
        const volumesArray: [number, number][] = data.history.map((entry) => [
          new Date(entry.timestamp).getTime(),
          0, // placeholder for volume
        ])

        marketData[coinGeckoId] = {
          prices: pricesArray,
          market_caps: marketCapsArray,
          total_volumes: volumesArray,
        }
      }
    }
  }

  return (
    <ExplorePage
      patchedTokenList={patchedTokenList}
      initialPrices={prices}
      initialMarketData={marketData}
    />
  )
}

export default Page
