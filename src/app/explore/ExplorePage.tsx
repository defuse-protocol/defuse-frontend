"use client"

import Pill from "@src/components/Pill"

import type { MarketDataReturnType } from "@src/utils/coinGeckoApiClient"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"
import { useEffect, useState } from "react"
import TokenRow from "./TokenRow"
import type { TokenRowData } from "./page"

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

// Convert period to days
const getDaysFromPeriod = (period: string) => {
  switch (period) {
    case "1d":
      return 1
    case "7d":
      return 7
    case "1m":
      return 30
    case "3m":
      return 90
    case "6m":
      return 180
    case "1y":
      return 365
    default:
      return 7
  }
}

const ExplorePage = ({
  patchedTokenList,
  initialPrices,
  initialMarketData,
}: {
  patchedTokenList: TokenRowData[]
  initialPrices: Record<string, number>
  initialMarketData: Record<string, MarketDataReturnType>
}) => {
  const [search, setSearch] = useState("")
  const searchParams = new URLSearchParams(window?.location?.search)
  const [period, setPeriod] = useState(searchParams.get("period") || "7d")
  const [prices, setPrices] = useState(initialPrices)
  const [marketData, setMarketData] = useState(initialMarketData)
  const [loading, setLoading] = useState(false)

  const filteredTokenList = patchedTokenList
    .filter(
      (token) =>
        token.symbol.toLowerCase().includes(search.toLowerCase()) ||
        token.name.toLowerCase().includes(search.toLowerCase())
    )
    .filter((token) => !["gnear", "noer"].includes(token.symbol.toLowerCase()))

  const setSearchParams = (params: Record<string, string>) => {
    const newSearchParams = new URLSearchParams(searchParams)
    for (const [key, value] of Object.entries(params)) {
      newSearchParams.set(key, value)
    }
    window.history.pushState(
      {},
      "",
      `${window.location.pathname}?${newSearchParams.toString()}`
    )
  }

  // Fetch data when period changes
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const supportedSymbols = patchedTokenList
          .map((token) => token.symbol.toUpperCase())
          .filter((symbol) =>
            Object.keys(coinGeckoIdBySymbol).includes(symbol.toLowerCase())
          )

        const days = getDaysFromPeriod(period)
        const response = await fetch(
          `/api/token-prices?symbols=${supportedSymbols.join(",")}&days=${days}`,
          { cache: "no-store" }
        )

        if (response.ok) {
          const result = await response.json()
          if (result.success) {
            const tokenPricesData: Record<string, TokenPriceData> = result.data

            // Convert our API data to the expected format
            const newPrices: Record<string, number> = {}
            const newMarketData: Record<string, MockMarketDataReturnType> = {}

            for (const [symbol, data] of Object.entries(tokenPricesData)) {
              if (data.latestPrice !== null) {
                // Store price using the CoinGecko ID as key for compatibility
                const coinGeckoId =
                  coinGeckoIdBySymbol[symbol.toLowerCase() as CoinGeckoId]
                if (coinGeckoId) {
                  newPrices[coinGeckoId] = data.latestPrice

                  // Convert history to the expected format for charts
                  const pricesArray: [number, number][] = data.history.map(
                    (entry) => [
                      new Date(entry.timestamp).getTime(), // timestamp
                      entry.price, // price
                    ]
                  )

                  // Mock market cap data (we don't have this from our API yet)
                  const marketCapsArray: [number, number][] = data.history.map(
                    (entry) => [
                      new Date(entry.timestamp).getTime(),
                      0, // placeholder for market cap
                    ]
                  )

                  // Mock volume data (we don't have this from our API yet)
                  const volumesArray: [number, number][] = data.history.map(
                    (entry) => [
                      new Date(entry.timestamp).getTime(),
                      0, // placeholder for volume
                    ]
                  )

                  newMarketData[coinGeckoId] = {
                    prices: pricesArray,
                    market_caps: marketCapsArray,
                    total_volumes: volumesArray,
                  }
                }
              }
            }

            setPrices(newPrices)
            setMarketData(newMarketData)
          }
        }
      } catch (error) {
        console.error("Failed to fetch token prices:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [period, patchedTokenList])

  return (
    <div className="w-full flex flex-col mx-auto mt-[24px] md:mt-[64px] pl-[5%] pr-[5%] max-w-7xl gap-12">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
          <Pill>{filteredTokenList.length} assets</Pill>
          {loading && <Pill>Loading...</Pill>}
        </div>
        <div className="flex flex-row items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            className="rounded-md border border-gray-3 bg-gray-3 p-4 text-sm text-gray-11 dark:border-gray-7 dark:bg-gray-8 dark:text-white placeholder:text-gray-12 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            value={period}
            onChange={(e) => {
              const newPeriod = e.target.value
              setPeriod(newPeriod)
              setSearchParams({ period: newPeriod })
            }}
            className="rounded-md border border-gray-3 font-bold bg-gray-3 p-4 pr-8 text-sm text-gray-12 dark:border-gray-7 dark:bg-gray-8 dark:text-white"
          >
            <option value="1d">1 day</option>
            <option value="7d">7 days</option>
            <option value="1m">1 month</option>
            <option value="3m">3 months</option>
            <option value="6m">6 months</option>
            <option value="1y">1 year</option>
          </select>
        </div>
      </div>
      <table className="w-full shadow-2xl rounded-md bg-white dark:bg-gray-4">
        <thead className="sticky top-0 z-10">
          <tr className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6 bg-white dark:bg-gray-4">
            <th className="py-4 px-6">Token</th>
            <th />
            <th className="py-4 px-6 text-center">Price</th>
            <th className="py-4 px-6 text-center">Change</th>
            {/* <th className="py-4 px-6 text-center">Mindshare</th> */}
            <th className="py-4 px-6 text-center">Market Cap</th>
            {/* <th className="py-4 px-6 text-center">Volume</th> */}
          </tr>
        </thead>
        <tbody className="max-h-[500px] overflow-y-auto">
          {filteredTokenList.map((token) => (
            <TokenRow
              key={token.symbol}
              token={token}
              prices={prices}
              marketData={
                marketData[
                  coinGeckoIdBySymbol[token.symbol.toLowerCase() as CoinGeckoId]
                ]
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ExplorePage
