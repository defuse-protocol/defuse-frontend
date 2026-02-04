"use client"

import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { ArrowDownIcon } from "@radix-ui/react-icons"
import AlertDialog from "@src/components/AlertDialog"
import Button from "@src/components/Button"
import type { TokenInfo } from "../types/base"
import { isBaseToken } from "../utils"
import { formatTokenValue } from "../utils/format"
import AssetComboIcon from "./Asset/AssetComboIcon"

type Props = {
  open: boolean
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: { amount: bigint; decimals: number }
  amountOut: { amount: bigint; decimals: number }
  newOppositeAmount: { amount: bigint; decimals: number }
  previousOppositeAmount: { amount: bigint; decimals: number }
  onConfirm: () => void
  onCancel: () => void
  swapType: QuoteRequest.swapType
}

function PriceChangeDialog({
  open,
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
  newOppositeAmount,
  previousOppositeAmount,
  onConfirm,
  onCancel,
  swapType,
}: Props) {
  return (
    <AlertDialog open={open}>
      <AlertDialog.Title className="text-xl font-semibold text-gray-12">
        The price has changed
      </AlertDialog.Title>
      <AlertDialog.Description className="mt-2 text-gray-11">
        Please confirm the new price in order to continue
      </AlertDialog.Description>

      <div className="relative mt-5">
        <div className="grid grid-rows-2 border border-gray-4 rounded-lg">
          {swapType === QuoteRequest.swapType.EXACT_INPUT ? (
            <>
              <ActualAmountBlock amount={amountIn} token={tokenIn} />
              <ChangedAmounts
                newOppositeAmount={newOppositeAmount}
                previousOppositeAmount={previousOppositeAmount}
                token={tokenOut}
              />
            </>
          ) : (
            <>
              <ChangedAmounts
                newOppositeAmount={newOppositeAmount}
                previousOppositeAmount={previousOppositeAmount}
                token={tokenIn}
              />
              <ActualAmountBlock amount={amountOut} token={tokenOut} />
            </>
          )}
        </div>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
          <div className="flex justify-center items-center w-[40px] h-[40px] rounded-md bg-gray-1 shadow-switch-token dark:shadow-switch-token-dark">
            <ArrowDownIcon width={18} height={18} />
          </div>
        </div>
        <div className="absolute left-0 right-0 top-1/2 h-px bg-gray-4 w-full -translate-y-1/2 pointer-events-none" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant="secondary" size="xl" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          size="xl"
          onClick={onConfirm}
          data-testid="confirm-new-price-button"
        >
          Confirm price
        </Button>
      </div>
    </AlertDialog>
  )
}

export default PriceChangeDialog

const ActualAmountBlock = ({
  amount,
  token,
}: {
  amount: { amount: bigint; decimals: number }
  token: TokenInfo
}) => (
  <div className="flex items-center justify-between p-6">
    <div className="flex flex-col gap-0.5">
      <div className="text-xl font-medium">
        {formatTokenValue(amount.amount, amount.decimals, {
          fractionDigits: amount.decimals,
        })}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {token.symbol}
      {token.icon && (
        <AssetComboIcon
          icon={token.icon as string}
          chainName={isBaseToken(token) ? token.originChainName : undefined}
        />
      )}
    </div>
  </div>
)

const ChangedAmounts = ({
  newOppositeAmount,
  previousOppositeAmount,
  token,
}: {
  newOppositeAmount: { amount: bigint; decimals: number }
  previousOppositeAmount: { amount: bigint; decimals: number }
  token: TokenInfo
}) => (
  <div className="flex items-center justify-between p-6">
    <div className="flex flex-col gap-1 font-medium">
      <div className="text-gray-10">
        <span className="line-through">
          {formatTokenValue(
            previousOppositeAmount.amount,
            previousOppositeAmount.decimals,
            {
              fractionDigits: previousOppositeAmount.decimals,
            }
          )}
        </span>{" "}
        (old)
      </div>
      <div>
        {formatTokenValue(
          newOppositeAmount.amount,
          newOppositeAmount.decimals,
          {
            fractionDigits: newOppositeAmount.decimals,
          }
        )}{" "}
        (new)
      </div>
    </div>
    <div className="flex items-center gap-2">
      {token.symbol}
      {token.icon && (
        <AssetComboIcon
          icon={token.icon as string}
          chainName={isBaseToken(token) ? token.originChainName : undefined}
        />
      )}
    </div>
  </div>
)
