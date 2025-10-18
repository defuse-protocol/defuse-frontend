"use client"
import * as AlertDialog from "@radix-ui/react-alert-dialog"
import { ArrowDownIcon } from "@radix-ui/react-icons"
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
          Please confirm the new price in order to continue
        </AlertDialog.Description>

        <div className="relative mt-5">
          <div className="grid grid-rows-2">
            <div className="flex items-center justify-between border border-gray-4 p-6 rounded-tl-lg rounded-tr-lg">
              <div className="flex flex-col gap-0.5">
                <div className="text-xl font-medium">
                  {formatTokenValue(amountIn.amount, amountIn.decimals, {
                    fractionDigits: amountIn.decimals,
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tokenIn.symbol}
                {tokenIn.icon && (
                  <AssetComboIcon
                    icon={tokenIn.icon as string}
                    name={
                      (tokenIn.name as string | undefined) ?? tokenIn.symbol
                    }
                    chainName={
                      isBaseToken(tokenIn) ? tokenIn.originChainName : undefined
                    }
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border border-gray-4 p-6 rounded-b-lg rounded-br-lg border-t-0">
              <div className="flex flex-col gap-1 font-medium">
                {previousAmountOut ? (
                  <div className="text-gray-10">
                    <span className="line-through">
                      {formatTokenValue(
                        previousAmountOut.amount,
                        previousAmountOut.decimals,
                        {
                          fractionDigits: previousAmountOut.decimals,
                        }
                      )}
                    </span>{" "}
                    (old)
                  </div>
                ) : null}
                <div>
                  {formatTokenValue(
                    newAmountOut.amount,
                    newAmountOut.decimals,
                    {
                      fractionDigits: newAmountOut.decimals,
                    }
                  )}{" "}
                  (new)
                </div>
              </div>
              <div className="flex items-center gap-2">
                {tokenOut.symbol}
                {tokenOut.icon && (
                  <AssetComboIcon
                    icon={tokenOut.icon as string}
                    name={
                      (tokenOut.name as string | undefined) ?? tokenOut.symbol
                    }
                    chainName={
                      isBaseToken(tokenOut)
                        ? tokenOut.originChainName
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
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
            <Button
              size="4"
              type="button"
              onClick={onConfirm}
              data-testid="confirm-new-price-button"
            >
              Confirm new price
            </Button>
          </themes_AlertDialog.Action>
        </div>
      </themes_AlertDialog.Content>
    </AlertDialog.Root>
  )
}
