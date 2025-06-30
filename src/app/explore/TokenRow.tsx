import Image from "next/image"

import type { MarketDataReturnType } from "@src/utils/coinGeckoApiClient"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"
import MiniPriceChart from "./MiniPriceChart"
import type { TokenRowData } from "./page"

const TokenRow = ({
  token,
  prices,
  marketData,
}: {
  token: TokenRowData
  prices: Record<string, number>
  marketData: MarketDataReturnType
}) => {
  const chartData = marketData?.prices?.map((price: number[]) => price[1]) ?? []
  const priceDiff =
    chartData.length > 1 ? chartData[chartData.length - 1] - chartData[0] : 0
  const percentChange =
    chartData.length > 1 && chartData[0] !== 0
      ? (priceDiff / chartData[0]) * 100
      : 0
  const marketCap =
    marketData?.market_caps?.[marketData.market_caps.length - 1]?.[1]

  const tdClassNames = "py-4 px-6 text-center text-sm text-gray-12 font-medium"
  return (
    <tr
      key={token.symbol}
      className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6 hover:bg-gray-3 dark:hover:bg-gray-3"
    >
      <td className="py-4 px-6">
        <div className="flex flex-row items-center gap-2">
          <div className="relative overflow-hidden size-7 flex justify-center items-center rounded-full z-0">
            <Image
              src={token.icon}
              alt={token.name || "Coin Logo"}
              className="w-full h-full object-contain"
              width={28}
              height={28}
            />
          </div>
          <div className="flex flex-col items-start">
            <h1 className="text-sm font-bold text-gray-12">{token.name}</h1>
            <p className="text-xs text-gray-11 dark:text-gray-12">
              {token.symbol}
            </p>
          </div>
        </div>
      </td>
      <td>
        <MiniPriceChart data={chartData} />
      </td>
      <td className={tdClassNames}>
        $
        {prices[
          coinGeckoIdBySymbol[token.symbol.toLowerCase() as CoinGeckoId]
        ]?.toFixed(2) ?? "N/A"}
      </td>
      <td className="py-4 px-6">
        <div className="flex flex-row justify-center items-center gap-2 text-sm text-gray-12 font-medium">
          {typeof percentChange === "number" && (
            <>
              <span
                className={
                  percentChange > 0
                    ? "text-green-600 font-medium"
                    : percentChange < 0
                      ? "text-red-600 font-medium"
                      : "text-gray-11 font-medium"
                }
              >
                {Math.abs(percentChange).toFixed(2)}%
              </span>
              {percentChange > 0 ? (
                <svg
                  className="w-3 h-3 text-green-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Up arrow</title>
                  <path d="M12 8L19 15H5L12 8Z" />
                </svg>
              ) : percentChange < 0 ? (
                <svg
                  className="w-3 h-3 text-red-600"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Down arrow</title>
                  <path d="M12 16L19 9H5L12 16Z" />
                </svg>
              ) : null}
            </>
          )}
        </div>
      </td>
      {/* <td className={tdClassNames}>{token.mindshare}%</td> */}
      <td className={tdClassNames}>
        {(() => {
          const cap = marketCap ?? 0
          if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`
          if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`
          if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`
          return "$0"
        })()}
      </td>
      {/* <td className={tdClassNames}>{`$${(token.volume / 1e9).toFixed(1)}B`}</td> */}
    </tr>
  )
}

export default TokenRow
