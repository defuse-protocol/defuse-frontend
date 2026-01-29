import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import { BASIS_POINTS_DENOMINATOR } from "../../../utils/tokenUtils"
import { useSwapRateData } from "../hooks/useSwapRateData"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

interface SwapQuoteInfoProps {
  tokenOut: TokenInfo
  tokenIn: TokenInfo
}

export function SwapQuoteInfo({ tokenOut, tokenIn }: SwapQuoteInfoProps) {
  const { slippageBasisPoints, minAmountOut } = useSwapRateData()
  const { setModalType } = useModalStore((state) => state)

  const actorRef = SwapUIMachineContext.useActorRef()
  const snapshot = SwapUIMachineContext.useSelector((state) => state)
  const quote = snapshot.context.quote
  const tokenDeltas =
    quote != null && quote.tag === "ok" ? quote.value.tokenDeltas : null
  const swapType = snapshot.context.formValues.swapType

  const handleOpenSlippageSettings = () => {
    setModalType(ModalType.MODAL_SLIPPAGE_SETTINGS, {
      modalType: ModalType.MODAL_SLIPPAGE_SETTINGS,
      actorRef,
      currentSlippage: slippageBasisPoints,
      tokenDeltas,
      tokenOut,
      tokenIn,
      swapType,
    })
  }

  // Only show when we have a valid quote
  if (!minAmountOut || minAmountOut.amount <= 0n) {
    return null
  }

  const slippagePercent = Intl.NumberFormat(undefined, {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(slippageBasisPoints / Number(BASIS_POINTS_DENOMINATOR))

  const minReceiveFormatted = formatTokenValue(
    minAmountOut.amount,
    minAmountOut.decimals,
    { fractionDigits: 6 }
  )

  return (
    <dl className="mt-4 space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <dt className="text-gray-500 font-medium">Max slippage</dt>
        <dd>
          <button
            type="button"
            onClick={handleOpenSlippageSettings}
            className="flex items-center gap-1.5 font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            {slippagePercent}
            <AdjustmentsHorizontalIcon className="size-4" />
          </button>
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="text-gray-500 font-medium">Receive at least</dt>
        <dd className="font-semibold text-gray-900">
          {minReceiveFormatted} {tokenOut.symbol}
        </dd>
      </div>
    </dl>
  )
}
