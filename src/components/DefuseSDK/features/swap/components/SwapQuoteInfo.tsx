import { AdjustmentsHorizontalIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import HelperPopover from "@src/components/HelperPopover"
import { useModalStore } from "../../../providers/ModalStoreProvider"
import { ModalType } from "../../../stores/modalStore"
import { BASIS_POINTS_DENOMINATOR } from "../../../utils/tokenUtils"
import { useSwapRateData } from "../hooks/useSwapRateData"
import SwapRateInfo from "./SwapRateInfo"
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
    <dl className="mt-5 space-y-2.5 text-sm animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <dt className="text-gray-500 font-medium">Rate</dt>
        <dd>
          <SwapRateInfo tokenIn={tokenIn} tokenOut={tokenOut} />
        </dd>
      </div>
      <div className="flex items-center justify-between">
        <dt className="flex items-center text-gray-500 font-medium gap-1.5">
          Max slippage
          <HelperPopover>
            The slippage setting is a safety mechanism to protect you from
            getting a final price that is very different than the quoted price.
            If the specified slippage would be exceeded, your swap will be
            cancelled.
          </HelperPopover>
        </dt>
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
        <dt className="flex items-center text-gray-500 font-medium gap-1.5">
          Receive at least
          <HelperPopover>
            The quoted amount is an estimate. Multiple solvers compete to give
            you the best price. Your max slippage setting guarantees a minimum
            amount you'll receive—if that can't be met, the swap is cancelled.
          </HelperPopover>
        </dt>
        <dd className="font-semibold text-gray-900">
          {minReceiveFormatted} {tokenOut.symbol}
        </dd>
      </div>
    </dl>
  )
}
