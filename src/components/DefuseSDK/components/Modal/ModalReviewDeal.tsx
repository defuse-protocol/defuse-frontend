import { ArrowDownIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import Button from "@src/components/Button"
import type { TokenInfo } from "../../types/base"
import { formatDisplayAmount, formatUsdAmount } from "../../utils/format"
import AssetComboIcon from "../Asset/AssetComboIcon"
import { BaseModalDialog } from "./ModalDialog"

const ModalReviewDeal = ({
  open,
  onClose,
  onConfirm,
  loading,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  usdAmountIn,
  usdAmountOut,
  expiryDateString,
  errorMessage,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  loading: boolean
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: string
  amountOut: string
  usdAmountIn: number
  usdAmountOut: number
  expiryDateString: string
  errorMessage?: string
}) => {
  return (
    <BaseModalDialog title="Review trade" open={open} onClose={onClose}>
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
          <dt className="text-sm text-gray-900 font-semibold">Expires</dt>
          <dd className="text-sm text-gray-500 font-medium">
            {expiryDateString}
          </dd>
        </div>
      </dl>

      <Button
        className="mt-5"
        type="button"
        size="xl"
        onClick={onConfirm}
        loading={loading}
        fullWidth
      >
        Create trade
      </Button>

      {errorMessage && (
        <Alert variant="error" className="mt-2">
          {errorMessage}
        </Alert>
      )}
    </BaseModalDialog>
  )
}

export default ModalReviewDeal
