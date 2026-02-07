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
    <BaseModalDialog title="Review deal" open={open} onClose={onClose}>
      <div className="flex flex-col gap-5 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-fg tracking-tight leading-7">
              {formatDisplayAmount(amountIn)} {tokenIn.symbol}
            </div>
            <div className="text-base/5 font-medium text-fg-secondary">
              {formatUsdAmount(usdAmountIn)}
            </div>
          </div>
          <AssetComboIcon icon={tokenIn?.icon} />
        </div>

        <ArrowDownIcon className="size-6 text-fg-tertiary" />

        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold text-fg tracking-tight leading-7">
              {formatDisplayAmount(amountOut)} {tokenOut.symbol}
            </div>
            <div className="text-base/5 font-medium text-fg-secondary">
              {formatUsdAmount(usdAmountOut)}
            </div>
          </div>
          <AssetComboIcon icon={tokenOut?.icon} />
        </div>
      </div>

      <dl className="mt-7 pt-5 border-t border-border space-y-2">
        <div className="flex items-center justify-between">
          <dt className="text-sm text-fg font-semibold">Expires</dt>
          <dd className="text-sm text-fg-secondary font-medium">
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
        Create deal
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
