"use client"

import { ArrowRightIcon } from "@radix-ui/react-icons"
import { Button } from "@radix-ui/themes"
import Image from "next/image"
import { useRouter } from "next/navigation"

import PercentChangeIndicator from "@src/components/PercentChangeIndicator"
import { cn } from "@src/utils/cn"

import MiniPriceChart from "./MiniPriceChart"
import type { TokenRowData } from "./page"

type PriceChangeType = {
  day: number
  week: number
  month: number
  weekIndex: number
}

const TokenRow = ({
  token,
  priceData,
  isLoading,
}: {
  token: TokenRowData
  priceData: { prices: number[]; timestamps: number[] }
  isLoading: boolean
}) => {
  const { prices, timestamps } = priceData
  const priceChanges = calculatePriceChanges(prices, timestamps)

  const router = useRouter()

  const handleClick = () => {
    if (["usdc", "usdt", "dai"].includes(token.symbol.toLowerCase())) {
      router.push(`/?from=${token.symbol}&to=NEAR`)
    } else {
      router.push(`/?from=USDC&to=${token.symbol}`)
    }
  }

  if (isLoading) {
    return <TokenRowSkeleton />
  }
  if (prices.length < 2 && !isLoading) {
    return null
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(8)}`
    }
    return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

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
      <td className="w-auto lg:w-full py-4 pl-6 pr-0 lg:pr-6 flex flex-row justify-between items-center">
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
          className="hidden lg:block opacity-0 md:group-hover:opacity-100 transition-opacity duration-300"
        >
          Trade <ArrowRightIcon className="w-4 h-4" />
        </Button>
      </td>
      <td className="lg:py-4 lg:px-6 text-center text-md text-gray-12 font-medium text-sm w-auto lg:w-32">
        {formatPrice(prices[prices.length - 1] ?? 0)}
      </td>

      <td className="hidden xl:table-cell py-4 px-6 w-24">
        <PercentChangeIndicator percentChange={priceChanges.day} />
      </td>

      <td className="lg:py-4 lg:px-6 w-24">
        <PercentChangeIndicator percentChange={priceChanges.week} />
      </td>

      <td className="hidden xl:table-cell py-4 px-6 w-24">
        <PercentChangeIndicator percentChange={priceChanges.month} />
      </td>

      <td className="hidden lg:table-cell lg:py-4 lg:px-6 text-center text-md text-gray-12 font-medium text-sm w-36">
        {(() => {
          const cap = token.marketCap ?? 0
          if (cap >= 1e12) return `$${(cap / 1e12).toFixed(1)}T`
          if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`
          if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`
          return "$0"
        })()}
      </td>
      <td className="hidden lg:table-cell px-4 w-30 items-center justify-center">
        <MiniPriceChart
          data={prices.slice(priceChanges.weekIndex, prices.length)}
        />
      </td>

      {/* <td className={tdClassNames}>{token.mindshare}%</td> */}
      {/* <td className={tdClassNames}>{`$${(token.volume / 1e9).toFixed(1)}B`}</td> */}
    </tr>
  )
}

const TokenRowSkeleton = () => {
  return (
    <tr className="text-left text-xs text-gray-11 dark:text-gray-12 py-5 px-6 border-t border-gray-100 dark:border-gray-700">
      <td className="py-4 px-6 w-96">
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
      <td className="w-32">
        <div className="h-6 px-6 w-full bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
      </td>
      <td className="py-4 px-6 text-center w-24">
        <div className="h-4 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
      <td className="py-4 px-6 text-center w-24">
        <div className="h-4 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
      <td className="py-4 px-6 text-center w-24">
        <div className="h-4 w-16 bg-gray-3 dark:bg-gray-7 rounded animate-pulse mx-auto" />
      </td>
      <td className="w-32">
        <div className="h-6 px-6 w-full bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
      </td>
      <td className="w-30 px-4">
        <div className="h-12 w-28 bg-gray-3 dark:bg-gray-7 rounded animate-pulse" />
      </td>
    </tr>
  )
}

const calculatePriceChanges = (
  prices: number[],
  timestamps: number[]
): PriceChangeType => {
  if (!prices || prices.length < 2) {
    return { day: 0, week: 0, month: 0, weekIndex: 0 }
  }

  const now = timestamps[timestamps.length - 1]
  const dayAgo = now - 86400000
  const weekAgo = now - 604800000
  const monthAgo = now - 2592000000

  let dayIndex = timestamps.length - 1
  let weekIndex = timestamps.length - 1
  let monthIndex = timestamps.length - 1

  for (let i = timestamps.length - 1; i >= 0; i--) {
    if (
      Math.abs(timestamps[i] - dayAgo) < Math.abs(timestamps[dayIndex] - dayAgo)
    ) {
      dayIndex = i
    }
    if (
      Math.abs(timestamps[i] - weekAgo) <
      Math.abs(timestamps[weekIndex] - weekAgo)
    ) {
      weekIndex = i
    }
    if (
      Math.abs(timestamps[i] - monthAgo) <
      Math.abs(timestamps[monthIndex] - monthAgo)
    ) {
      monthIndex = i
    }
  }

  const currentPrice = prices[prices.length - 1]
  const dayChange = ((currentPrice - prices[dayIndex]) / prices[dayIndex]) * 100
  const weekChange =
    ((currentPrice - prices[weekIndex]) / prices[weekIndex]) * 100
  const monthChange =
    ((currentPrice - prices[monthIndex]) / prices[monthIndex]) * 100

  return {
    weekIndex,
    day: dayChange,
    week: weekChange,
    month: monthChange,
  }
}

export default TokenRow
