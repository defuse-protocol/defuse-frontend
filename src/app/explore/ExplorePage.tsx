"use client"

import Pill from "@src/components/Pill"

import type { MarketDataReturnType } from "@src/utils/coinGeckoApiClient"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"
import { useState } from "react"
import TokenRow from "./TokenRow"
import type { TokenRowData } from "./page"

const ExplorePage = ({
  patchedTokenList,
  prices,
  marketData,
}: {
  patchedTokenList: TokenRowData[]
  prices: Record<string, number>
  marketData: Record<string, MarketDataReturnType>
}) => {
  const [search, setSearch] = useState("")
  const searchParams = new URLSearchParams(window?.location?.search)
  const [period, setPeriod] = useState(searchParams.get("period") || "7d")

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

  return (
    <div className="w-full flex flex-col mx-auto mt-[24px] md:mt-[64px] pl-[5%] pr-[5%] max-w-7xl gap-12">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row items-center gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
          <Pill>{filteredTokenList.length} assets</Pill>
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
