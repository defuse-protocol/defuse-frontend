"use client"

import { useEffect, useState } from "react"

import Pill from "@src/components/Pill"
import { coinPricesApiClient } from "@src/utils/coinPricesApiClient"
import { prepareExplorePageTokens } from "@src/utils/prepareExplorePageTokens"

import TokenRow from "./TokenRow"
import type { TokenRowData } from "./page"

const ExplorePage = ({
  patchedTokenList,
}: {
  patchedTokenList: TokenRowData[]
}) => {
  const [search, setSearch] = useState("")
  const [prices, setPrices] = useState<Record<string, number[]>>({})
  const [timestamps, setTimestamps] = useState<Record<string, number[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      const livePrices = await coinPricesApiClient.getPrices(
        patchedTokenList.map((t) => t.symbol).join(","),
        "30"
      )
      const [priceEntries, timestampEntries] = Object.entries(
        livePrices
      ).reduce(
        (acc, [symbol, prices]) => {
          acc[0].push([symbol, prices.map(([_, price]) => price)])
          acc[1].push([
            symbol,
            prices.map(([timestamp]) => new Date(timestamp).getTime()),
          ])
          return acc
        },
        [[], []] as [Array<[string, number[]]>, Array<[string, number[]]>]
      )

      setPrices(Object.fromEntries(priceEntries))
      setTimestamps(Object.fromEntries(timestampEntries))
      setIsLoading(false)
    }
    fetchPrices()
  }, [patchedTokenList])

  const filteredTokenList = prepareExplorePageTokens(patchedTokenList, search)

  return (
    <div className="w-full flex flex-col mx-auto mt-[24px] md:mt-[64px] pl-[5%] pr-[5%] max-w-7xl gap-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex flex-row w-full md:w-auto justify-between md:justify-center items-center gap-4">
          <h1 className="text-4xl font-extrabold tracking-tight">Explore</h1>
          <Pill>{filteredTokenList.length} assets</Pill>
        </div>
        <div className="flex flex-row w-full md:w-auto items-center gap-4">
          <input
            type="text"
            placeholder="Search"
            className="w-full rounded-md border border-gray-3 bg-gray-3 p-4 text-sm text-gray-11 dark:border-gray-7 dark:bg-gray-8 dark:text-white placeholder:text-gray-12 font-bold"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full lg:min-w-[640px] shadow-xl rounded-4xl bg-white dark:bg-gray-4 overflow-clip">
          <thead className="sticky top-0 z-10 pt-2 ">
            <tr className="text-left text-sm text-gray-11 dark:text-gray-12 py-4 px-6 bg-white dark:bg-gray-4 rounded-t-4xl">
              <th className="w-24 lg:w-full pt-6 pb-4 px-6">Token</th>
              <th className="w-24 pt-6 pb-4 px-2 lg:px-6 text-center">Price</th>
              <th className="hidden xl:table-cell w-24 pt-6 pb-4 px-2 xl:px-6 text-center">
                24h
              </th>
              <th className="w-24 pt-6 pb-4 px-2 lg:px-6 text-center">7d</th>
              <th className="hidden xl:table-cell w-24 pt-6 pb-4 px-2 lg:px-6 text-center">
                30d
              </th>
              <th className="hidden lg:table-cell w-36 pt-6 pb-4 px-2 lg:px-6 text-center whitespace-nowrap">
                Market Cap
              </th>
              <th className="hidden lg:table-cell w-30 pt-6 pb-4 px-2 lg:px-6 text-center whitespace-nowrap">
                7d Change
              </th>
              {/* <th className="pt-6 pb-4 px-2 md:px-6 text-center">Mindshare</th> */}
              {/* <th className="pt-6 pb-4 px-2 md:px-6 text-center">Volume</th> */}
            </tr>
          </thead>
          <tbody className="max-h-[500px] overflow-y-auto">
            {filteredTokenList.map((token) => (
              <TokenRow
                key={token.symbol}
                priceData={{
                  prices: prices[token.symbol],
                  timestamps: timestamps[token.symbol],
                }}
                token={token}
                isLoading={isLoading}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
export default ExplorePage
