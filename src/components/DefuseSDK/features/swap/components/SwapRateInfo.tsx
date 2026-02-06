import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useState } from "react"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue } from "../../../utils/format"
import { useSwapRateData } from "../hooks/useSwapRateData"

interface SwapRateInfoProps {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
}

function SwapRateInfo({ tokenIn, tokenOut }: SwapRateInfoProps) {
  const { exchangeRate, inverseExchangeRate } = useSwapRateData()
  const [showBasePrice, setShowBasePrice] = useState(false)

  const rateIsReady = exchangeRate != null || inverseExchangeRate != null

  if (!rateIsReady) return null

  return (
    <button
      type="button"
      onClick={() => setShowBasePrice((prev) => !prev)}
      className="text-sm font-semibold group text-gray-900 hover:underline"
    >
      {showBasePrice
        ? exchangeRate != null &&
          renderExchangeRate({
            rate: exchangeRate,
            baseToken: tokenIn,
            quoteToken: tokenOut,
          })
        : inverseExchangeRate != null &&
          renderExchangeRate({
            rate: inverseExchangeRate,
            baseToken: tokenOut,
            quoteToken: tokenIn,
          })}
    </button>
  )
}

export default SwapRateInfo

function renderExchangeRate({
  rate,
  baseToken,
  quoteToken,
}: {
  rate: TokenValue
  baseToken: TokenInfo
  quoteToken: TokenInfo
}) {
  return `1 ${baseToken.symbol} = ${formatTokenValue(
    rate.amount,
    rate.decimals,
    {
      fractionDigits: 5,
    }
  )} ${quoteToken.symbol}`
}
