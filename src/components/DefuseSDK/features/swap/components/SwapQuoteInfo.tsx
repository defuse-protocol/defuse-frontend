import {
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { useState } from "react"
import { BaseModalDialog } from "../../../components/Modal/ModalDialog"
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
  const [isInfoOpen, setIsInfoOpen] = useState(false)

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
    <>
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
          <dd className="flex items-center gap-1.5 font-semibold text-gray-900">
            {minReceiveFormatted} {tokenOut.symbol}
            <button
              type="button"
              onClick={() => setIsInfoOpen(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Learn more about quotes"
            >
              <InformationCircleIcon className="size-4" />
            </button>
          </dd>
        </div>
      </dl>

      <BaseModalDialog
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        title={
          <span className="flex items-center gap-2">
            <InformationCircleIcon className="size-5 text-gray-400" />
            How quotes work
          </span>
        }
      >
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          The quoted amount is an estimate. Multiple solvers compete to give you
          the best price. Your max slippage setting guarantees a minimum amount
          you'll receive—if that can't be met, the swap is cancelled.
        </p>
      </BaseModalDialog>
    </>
  )
}
