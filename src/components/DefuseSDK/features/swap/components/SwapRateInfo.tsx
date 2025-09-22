import * as Accordion from "@radix-ui/react-accordion"
import { CaretDownIcon } from "@radix-ui/react-icons"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useReducer } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/Popover"
import {
  type TokenUsdPriceData,
  useTokensUsdPrices,
} from "../../../hooks/useTokensUsdPrices"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { BASIS_POINTS_DENOMINATOR } from "../../../utils/tokenUtils"
import { useSwapRateData } from "../hooks/useSwapRateData"

interface SwapRateInfoProps {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
}

export function SwapRateInfo({ tokenIn, tokenOut }: SwapRateInfoProps) {
  const {
    minAmountOut,
    slippageBasisPoints,
    exchangeRate,
    inverseExchangeRate,
  } = useSwapRateData()
  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const [showBasePrice, toggleBasePrice] = useToggle()

  // todo: might need to handle outside of the component
  const rateIsReady = exchangeRate != null || inverseExchangeRate != null
  if (!rateIsReady) {
    return null
  }

  return (
    <Accordion.Root type="single" collapsible className="mt-3">
      <Accordion.Item value="show">
        <div className="flex justify-between items-center flex-1 text-gray-11">
          <button
            type="button"
            onClick={toggleBasePrice}
            className="text-xs font-medium"
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

          <Accordion.Trigger className="transition-all [&[data-state=open]>svg]:rotate-180">
            <CaretDownIcon className="h-5 w-5 transition-transform duration-200" />
          </Accordion.Trigger>
        </div>

        <Accordion.Content className="overflow-hidden transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          {/* Simple spacing for smooth toggle animation */}
          <div className="h-4" />

          <div className="flex flex-col gap-3.5 font-medium text-gray-11 text-xs">
            <div className="flex justify-between">
              <div className="flex gap-1 items-center">
                <div>Max slippage</div>

                <Popover>
                  <PopoverTrigger>
                    <InfoCircledIcon />
                  </PopoverTrigger>
                  <PopoverContent className="flex flex-col gap-2 text-xs">
                    <div className="text-gray-11">
                      If the price slips any further, your intent will not be
                      executed. Below is the minimum amount you are guaranteed
                      to receive.
                    </div>
                    {minAmountOut != null && (
                      <div className="flex justify-between p-2 rounded-md bg-gray-3 text-gray-11">
                        <div>Receive at least</div>

                        <div className="text-gray-12">
                          {formatTokenValue(
                            minAmountOut.amount,
                            minAmountOut.decimals,
                            { fractionDigits: 5 }
                          )}{" "}
                          {tokenOut.symbol}
                        </div>
                      </div>
                    )}
                  </PopoverContent>
                </Popover>
              </div>

              <div className="text-label">
                {Intl.NumberFormat(undefined, {
                  style: "percent",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(
                  slippageBasisPoints / Number(BASIS_POINTS_DENOMINATOR)
                )}
              </div>
            </div>
          </div>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  )
}

function useToggle(defaultValue = false) {
  return useReducer((state) => !state, defaultValue)
}

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
  return (
    <div className="flex gap-1">
      {`1 ${baseToken.symbol} = ${formatTokenValue(rate.amount, rate.decimals, {
        fractionDigits: 5,
      })} ${quoteToken.symbol}`}

      {renderTokenUsdPrice(
        formatTokenValue(rate.amount, rate.decimals),
        quoteToken,
        tokensUsdPriceData
      )}
    </div>
  )
}

function renderTokenUsdPrice(
  amount: string,
  token: TokenInfo,
  tokensUsdPriceData: TokenUsdPriceData | undefined
) {
  const price = getTokenUsdPrice(amount, token, tokensUsdPriceData)

  if (price != null) {
    return <span className="text-gray-a9">({formatUsdAmount(price)})</span>
  }

  return null
}
