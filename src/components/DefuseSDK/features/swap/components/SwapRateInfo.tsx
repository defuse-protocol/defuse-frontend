import { SlidersHorizontalIcon } from "@phosphor-icons/react"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { useReducer } from "react"
import {
  type TokenUsdPriceData,
  useTokensUsdPrices,
} from "../../../hooks/useTokensUsdPrices"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue, formatUsdAmount } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { BASIS_POINTS_DENOMINATOR } from "../../../utils/tokenUtils"
import { useSwapRateData } from "../hooks/useSwapRateData"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

interface SwapRateInfoProps {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
}

export function SwapRateInfo({ tokenIn, tokenOut }: SwapRateInfoProps) {
  const { slippageBasisPoints, exchangeRate, inverseExchangeRate } =
    useSwapRateData()
  const { data: tokensUsdPriceData } = useTokensUsdPrices()
  const [showBasePrice, toggleBasePrice] = useToggle()
  const { setModalType } = useModalStore((state) => state)

  const actorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((state) => state)
  const quote = snapshot.context.quote
  const tokenDeltas =
    quote != null && quote.tag === "ok" ? quote.value.tokenDeltas : null

  const handleOpenSlippageSettings = () => {
    setModalType(ModalType.MODAL_SLIPPAGE_SETTINGS, {
      modalType: ModalType.MODAL_SLIPPAGE_SETTINGS,
      actorRef,
      currentSlippage: slippageBasisPoints,
      tokenDeltas,
      tokenOut,
    })
  }

  const rateIsReady = exchangeRate != null || inverseExchangeRate != null

  return (
    <div className="flex flex-col gap-3.5 font-medium text-gray-11 text-xs">
      {rateIsReady && (
        <div className="flex flex-wrap justify-between items-center gap-2 text-gray-11">
          <button
            type="button"
            onClick={toggleBasePrice}
            className="text-xs font-medium hover:opacity-80 transition-opacity"
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

          <button
            type="button"
            onClick={handleOpenSlippageSettings}
            className="px-3 py-1.5 rounded-md border transition-all bg-gray-1 border-gray-6 hover:bg-gray-3 hover:border-gray-7 text-label font-medium text-xs cursor-pointer active:scale-[0.98] flex items-center gap-1.5"
          >
            <span>
              Max slippage:{" "}
              {Intl.NumberFormat(undefined, {
                style: "percent",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(slippageBasisPoints / Number(BASIS_POINTS_DENOMINATOR))}
            </span>
            <SlidersHorizontalIcon className="size-3.5" weight="regular" />
          </button>
        </div>
      )}
    </div>
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
