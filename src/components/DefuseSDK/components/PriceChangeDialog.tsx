"use client"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { ArrowDownIcon } from "@radix-ui/react-icons"
import { Button, AlertDialog as themes_AlertDialog } from "@radix-ui/themes"
import { cn } from "@src/utils/cn"
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

        <div className="relative mt-5">
          <div className="grid grid-rows-2">
            <Row
              token={tokenIn}
              amount={amountIn.amount}
              decimals={amountIn.decimals}
              isTop
            />
            <Row
              token={tokenOut}
              amount={newAmountOut.amount}
              previousAmount={previousAmountOut?.amount}
              decimals={newAmountOut.decimals}
            />
          </div>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10">
            <div className="flex justify-center items-center w-[40px] h-[40px] rounded-md bg-gray-1 shadow-switch-token dark:shadow-switch-token-dark">
              <ArrowDownIcon width={18} height={18} />
            </div>
          </div>
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
  amount,
  previousAmount,
  decimals,
  isTop = false,
}: {
  token: TokenInfo
  amount: bigint
  previousAmount?: bigint
  decimals: number
  isTop?: boolean
}) {
  const symbol = token.symbol
  const icon = token.icon as string | undefined
  const name = token.name as string | undefined
  const chainName = isBaseToken(token) ? token.chainName : undefined
  return (
    <div
      className={cn(
        "flex items-center justify-between border border-gray-4 p-6",
        isTop
          ? "rounded-tl-lg rounded-tr-lg"
          : "rounded-b-lg rounded-br-lg border-t-0"
      )}
    >
      <div className="flex flex-col items-end gap-0.5">
        {previousAmount ? (
          <div className="text-right text-sm text-gray-10 line-through opacity-70">
            {formatTokenValue(previousAmount, decimals, {
              fractionDigits: decimals,
            })}{" "}
          </div>
        ) : null}
        <div className="text-sm font-medium">
          {formatTokenValue(amount, decimals, {
            fractionDigits: decimals,
          })}{" "}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {symbol}
        {icon && (
          <AssetComboIcon
            icon={icon}
            name={name ?? symbol}
            chainName={chainName}
          />
        )}
      </div>
    </div>
  )
}
