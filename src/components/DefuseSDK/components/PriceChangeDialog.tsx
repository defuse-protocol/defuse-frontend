"use client"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { Button, AlertDialog as themes_AlertDialog } from "@radix-ui/themes"
import type { TokenInfo } from "../types/base"
import { isBaseToken } from "../utils"
import { formatTokenValue } from "../utils/format"
import { AssetComboIcon } from "./Asset/AssetComboIcon"

type Props = {
  open: boolean
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  amountIn: { amount: bigint; decimals: number }
  newAmountOut: { amount: bigint; decimals: number }
  previousAmountOut?: { amount: bigint; decimals: number }
  onConfirm: () => void
  onCancel: () => void
}

export function PriceChangeDialog({
  open,
  tokenIn,
  tokenOut,
  amountIn,
  newAmountOut,
  previousAmountOut,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <AlertDialog.Root open={open}>
      <themes_AlertDialog.Content className="max-w-md px-5 pt-5 pb-[max(env(safe-area-inset-bottom,0px),theme(spacing.5))] sm:animate-none animate-slide-up">
        <AlertDialog.Title className="text-xl font-semibold text-gray-12">
          The price has changed
        </AlertDialog.Title>
        <AlertDialog.Description className="mt-2 text-gray-11">
          Please confirm new price in order to continue
        </AlertDialog.Description>

        <div className="mt-5 space-y-3">
          <Row
            token={tokenIn}
            label="You pay"
            amount={amountIn.amount}
            decimals={amountIn.decimals}
          />
          <Row
            token={tokenOut}
            label="You receive"
            amount={newAmountOut.amount}
            previousAmount={previousAmountOut?.amount}
            decimals={newAmountOut.decimals}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
          <themes_AlertDialog.Cancel>
            <Button
              size="4"
              type="button"
              variant="soft"
              color="gray"
              onClick={onCancel}
            >
              Cancel
            </Button>
          </themes_AlertDialog.Cancel>
          <themes_AlertDialog.Action>
            <Button size="4" type="button" onClick={onConfirm}>
              Confirm new price
            </Button>
          </themes_AlertDialog.Action>
        </div>
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}

function Row({
  token,
  label,
  amount,
  previousAmount,
  decimals,
}: {
  token: TokenInfo
  label: string
  amount: bigint
  previousAmount?: bigint
  decimals: number
}) {
  const symbol = token.symbol
  const icon = token.icon as string | undefined
  const name = token.name as string | undefined
  const chainName = isBaseToken(token) ? token.chainName : undefined
  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-4 p-3">
      <div className="flex items-center gap-2">
        {icon ? (
          <AssetComboIcon
            icon={icon}
            name={name ?? symbol}
            chainName={chainName}
          />
        ) : (
          <span className="relative min-w-[28px] min-h-[28px] bg-gray-200 rounded-full" />
        )}
        <div className="text-sm text-gray-11">{label}</div>
      </div>
      <div className="text-right">
        <div className="flex flex-col items-end gap-0.5">
          {previousAmount ? (
            <div className="text-right text-xs text-gray-10 line-through opacity-70">
              {formatTokenValue(previousAmount, decimals, {
                fractionDigits: decimals,
              })}
            </div>
          ) : null}
          <div className="text-sm font-medium">
            {formatTokenValue(amount, decimals, {
              fractionDigits: decimals,
            })}
          </div>
        </div>
        <div className="text-xs text-gray-10">{symbol}</div>
      </div>
    </div>
  )
}
