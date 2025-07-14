"use client"

import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Button } from "@radix-ui/themes"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import { cn } from "@src/utils/cn"
import { coinPricesApiClient } from "@src/utils/coinPricesApiClient"
import { parsePeriod } from "@src/utils/parsePeriod"

import MiniPriceChart from "./MiniPriceChart"
import type { TokenRowData } from "./page"

const TokenRow = ({
  token,
  period,
}: {
  token: TokenRowData
  period: string
}) => {
  const [prices, setPrices] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      const livePrices = await coinPricesApiClient.getPrices(
        token.symbol,
        parsePeriod(period)
      )
      setPrices(livePrices[token.symbol].map(([_, price]) => price))
      setIsLoading(false)
    }
    fetchPrices()
  }, [token.symbol, period])

  const router = useRouter()
  const priceDiff =
    prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0
  const percentChange =
    prices.length > 1 && prices[0] !== 0
      ? (priceDiff / prices[0]) * 100
      : token.change

  const tdClassNames = "py-4 px-6 text-center text-md text-gray-12 font-bold"

  const handleClick = () => {
    if (["usdc", "usdt", "dai"].includes(token.symbol.toLowerCase())) {
      router.push(`/?from=${token.symbol}&to=NEAR`)
    } else {
      router.push(`/?from=USDC&tokenOut=${token.symbol}`)
    }
  }

  if (isLoading) {
    return <TokenRowSkeleton />
  }
  if (prices.length < 2 && !isLoading) {
    console.log("No data for", token.symbol)
    return null
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(8)}`
    }
    return `$${price.toFixed(2)}`
  }

  console.log(token.symbol, prices)

  return (
    <tr
      className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6 hover:bg-gray-3 dark:hover:bg-gray-3 group cursor-pointer border-t border-gray-100 dark:border-gray-700"
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          handleClick()
        }
      }}
      tabIndex={0}
    >
      <td className="py-4 px-6 flex flex-row justify-between items-center">
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
        <Button
          variant="solid"
          size="2"
          radius="full"
          color="teal"
          className="opacity-0  md:group-hover:opacity-100 transition-opacity duration-300"
        >
          Trade <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </td>
      <td>
        <MiniPriceChart data={prices} />
      </td>
      <td className={cn(tdClassNames, "text-base")}>
        {formatPrice(prices[prices.length - 1] ?? 0)}
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
          const cap = token.marketCap ?? 0
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

const TokenRowSkeleton = () => {
  return (
    <tr className="text-left text-xs text-gray-11 dark:text-gray-12 py-4 px-6">
      <td className="py-4 px-6">
        <div className="flex flex-row items-center gap-2">
          <div className="relative overflow-hidden size-7 flex justify-center items-center rounded-full z-0">
            <div className="w-7 h-7 bg-gray-3 dark:bg-gray-7 rounded-full animate-pulse" />
          </div>
          <div className="flex flex-col items-start gap-1">
            <div className="h-4 w-24 bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
            <div className="h-3 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
          </div>
        </div>
      </td>
      <td>
        <div className="h-12 w-32 bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
      </td>
      <td className="py-4 px-6 text-center">
        <div className="h-4 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
      <td className="py-4 px-6 text-center">
        <div className="h-4 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
      <td className="py-4 px-6 text-center">
        <div className="h-4 w-24 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
    </tr>
  )
}

export default TokenRow
