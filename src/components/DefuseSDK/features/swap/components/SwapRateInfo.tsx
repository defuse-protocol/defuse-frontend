import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useState } from "react"
import {
  type TokenUsdPriceData,
  useTokensUsdPrices,
} from "../../../hooks/useTokensUsdPrices"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { useSwapRateData } from "../hooks/useSwapRateData"

interface SwapRateInfoProps {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
}

function SwapRateInfo({ tokenIn, tokenOut }: SwapRateInfoProps) {
  const { exchangeRate, inverseExchangeRate } = useSwapRateData()
  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const [showBasePrice, setShowBasePrice] = useState(false)

  const rateIsReady = exchangeRate != null || inverseExchangeRate != null

  if (!rateIsReady) return null

  return (
    <button
      type="button"
      onClick={() => setShowBasePrice((prev) => !prev)}
      className="text-sm font-semibold group text-gray-600 hover:text-gray-900 transition-colors"
    >
      {showBasePrice
        ? exchangeRate != null &&
          renderExchangeRate({
            rate: exchangeRate,
            baseToken: tokenIn,
            quoteToken: tokenOut,
            tokensUsdPriceData,
          })
        : inverseExchangeRate != null &&
          renderExchangeRate({
            rate: inverseExchangeRate,
            baseToken: tokenOut,
            quoteToken: tokenIn,
            tokensUsdPriceData,
          })}
    </button>
  )
}

export default SwapRateInfo

function renderExchangeRate({
  rate,
  baseToken,
  quoteToken,
  tokensUsdPriceData,
}: {
  rate: TokenValue
  baseToken: TokenInfo
  quoteToken: TokenInfo
  tokensUsdPriceData: TokenUsdPriceData | undefined
}) {
  const price = getTokenUsdPrice(
    formatTokenValue(rate.amount, rate.decimals),
    quoteToken,
    tokensUsdPriceData
  )

  return (
    <>
      {`1 ${baseToken.symbol} = ${formatTokenValue(rate.amount, rate.decimals, {
        fractionDigits: 5,
      })} ${quoteToken.symbol}`}
      {price ? (
        <span className="text-gray-400 group-hover:text-gray-900 transition-colors">
          {" "}
          ({formatUsdAmount(price)})
        </span>
      ) : null}
    </>
  )
}
