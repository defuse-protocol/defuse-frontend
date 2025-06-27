import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"

import { LIST_TOKENS } from "@src/constants/tokens"
import {
  type MarketDataReturnType,
  coinGeckoApiClient,
} from "@src/utils/coinGeckoApiClient"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"

import ExplorePage from "./ExplorePage"

export type TokenRowData = (UnifiedTokenInfo | BaseTokenInfo) & {
  price: number
  change: number
  mindshare: number
  marketCap: number
  volume: number
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

  const coinGeckoIds = patchedTokenList
    .map(
      (token) => coinGeckoIdBySymbol[token.symbol.toLowerCase() as CoinGeckoId]
    )
    .filter(Boolean)

  let result = {}
  try {
    result = await coinGeckoApiClient.getUsdPrice(coinGeckoIds.join(","))
  } catch (error) {
    console.error("Failed to fetch prices from CoinGecko:", error)
  }

  const prices: Record<string, number> = {}
  for (const [id, price] of Object.entries(result)) {
    if (
      price &&
      typeof price === "object" &&
      "usd" in price &&
      typeof price.usd === "number"
    ) {
      prices[id] = price.usd
    }
  }

  // This is a bit of a problem with rate limits
  // See: https://support.coingecko.com/hc/en-us/articles/23402236550553-Can-I-batch-call-multiple-tokens-historical-data
  const marketData: Record<string, MarketDataReturnType> = {}
  for (const id of coinGeckoIds) {
    try {
      marketData[id] = await coinGeckoApiClient.getTokenMarketData(id)
    } catch (error) {
      console.error("Failed to fetch market data:", error)
    }
  }

  return (
    <ExplorePage
      patchedTokenList={patchedTokenList}
      prices={prices}
      marketData={marketData}
    />
  )
}

export default Page
