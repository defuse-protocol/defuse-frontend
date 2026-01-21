import { ArrowDownIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import clsx from "clsx"
import IntentCreationResult from "../../features/account/components/IntentCreationResult"
import type { Context } from "../../features/machines/swapUIMachine"
import SwapRateInfo from "../../features/swap/components/SwapRateInfo"
import usePriceImpact from "../../features/swap/hooks/usePriceImpact"
import { useSwapRateData } from "../../features/swap/hooks/useSwapRateData"
import type { TokenInfo } from "../../types/base"
import { formatDisplayAmount, formatUsdAmount } from "../../utils/format"
import { BASIS_POINTS_DENOMINATOR } from "../../utils/tokenUtils"
import AssetComboIcon from "../Asset/AssetComboIcon"
import { BaseModalDialog } from "./ModalDialog"

const ModalReviewSwap = ({
  open,
  onClose,
  onConfirm,
  loading,
  intentCreationResult,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  usdAmountIn,
  usdAmountOut,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  intentCreationResult: Context["intentCreationResult"]
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: string
  amountOut: string
  usdAmountIn: number
  usdAmountOut: number
}) => {
  const { slippageBasisPoints } = useSwapRateData()
  const priceImpact = usePriceImpact({
    amountIn: usdAmountIn,
    amountOut: usdAmountOut,
  })

  return (
    <BaseModalDialog title="Review swap" open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight leading-7">
              {formatDisplayAmount(amountIn)} {tokenIn.symbol}
            </div>
            <div className="text-base/5 font-medium text-gray-500">
              {formatUsdAmount(usdAmountIn)}
            </div>
          </div>
          <AssetComboIcon icon={tokenIn?.icon} name={tokenIn?.name} />
        </div>

        <ArrowDownIcon className="size-6 text-gray-400" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-gray-900 tracking-tight leading-7">
              {formatDisplayAmount(amountOut)} {tokenOut.symbol}
            </div>
            <div className="text-base/5 font-medium text-gray-500">
              {formatUsdAmount(usdAmountOut)}
            </div>
          </div>
          <AssetComboIcon icon={tokenOut?.icon} name={tokenOut?.name} />
        </div>
      </div>

      <dl className="mt-7 pt-5 border-t border-gray-200 space-y-2">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-500 font-medium">Rate</dt>
          <dd>
            <SwapRateInfo tokenIn={tokenIn} tokenOut={tokenOut} />
          </dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-sm text-gray-500 font-medium">Max slippage</dt>
          <dd className="text-sm font-semibold text-gray-900">
            {Intl.NumberFormat(undefined, {
              style: "percent",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(slippageBasisPoints / Number(BASIS_POINTS_DENOMINATOR))}
          </dd>
        </div>

        {Boolean(priceImpact) && (
          <div className="flex items-center justify-between">
            <dt className="text-sm text-gray-500 font-medium">Price impact</dt>
            <dd
              className={clsx("text-sm font-semibold", {
                "text-green-600": priceImpact?.status === "favorable",
                "text-red-600": priceImpact?.status === "unfavorable",
              })}
            >
              {priceImpact?.displayText}
            </dd>
          </div>
        )}
      </dl>

      <Button
        className="mt-5"
        type="button"
        size="xl"
        onClick={onConfirm}
        loading={loading}
        fullWidth
      >
        Swap
      </Button>

      <IntentCreationResult intentCreationResult={intentCreationResult} />
    </BaseModalDialog>
  )
}

export default ModalReviewSwap
