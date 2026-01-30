import { InformationCircleIcon as InformationCircleIconSmall } from "@heroicons/react/16/solid"
import {
  AdjustmentsHorizontalIcon,
  InformationCircleIcon,
} from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
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
      <dl className="mt-6 space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-gray-500 font-medium">Max slippage</dt>
          <dd>
            <Button
              variant="secondary"
              size="xs"
              onClick={handleOpenSlippageSettings}
            >
              {slippagePercent}
              <AdjustmentsHorizontalIcon className="size-4" />
            </Button>
          </dd>
        </div>
        <div className="flex items-center justify-between">
          <dt className="text-gray-500 font-medium">Receive at least</dt>
          <dd className="flex items-center gap-1.5 font-semibold text-gray-900">
            {minReceiveFormatted} {tokenOut.symbol}
            <Button
              size="xs"
              variant="secondary"
              onClick={() => setIsInfoOpen(true)}
            >
              <span className="sr-only">Learn more about quotes</span>
              <InformationCircleIconSmall className="size-4" />
            </Button>
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
        <p className="mt-1 text-sm/5 font-medium">
          The quoted amount is an estimate. Multiple solvers compete to give you
          the best price. Your max slippage setting guarantees a minimum amount
          you'll receive—if that can't be met, the swap is cancelled.
        </p>
        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-4"
          onClick={() => setIsInfoOpen(false)}
        >
          Close
        </Button>
      </BaseModalDialog>
    </>
  )
}
