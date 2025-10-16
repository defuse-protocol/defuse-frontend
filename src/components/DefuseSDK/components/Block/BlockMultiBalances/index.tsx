import { Button } from "@radix-ui/themes"
import { TooltipInfo } from "@src/components/DefuseSDK/components/TooltipInfo"
import clsx from "clsx"
import type { ReactNode } from "react"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue } from "../../../utils/format"

export interface BlockMultiBalancesProps {
  balance: bigint
  transitBalance?: TokenValue
  decimals: number
  className?: string
  maxButtonSlot?: ReactNode
  halfButtonSlot?: ReactNode
}

export function BlockMultiBalances({
  balance,
  transitBalance,
  decimals,
  className,
  maxButtonSlot,
  halfButtonSlot,
}: BlockMultiBalancesProps) {
  const active = balance > 0n
  return (
    <div
      className={clsx("flex items-center gap-1 md:gap-1.5 min-w-0", className)}
    >
      {/* Balance */}
      <div
        className={clsx(
          "text-xs font-bold truncate min-w-0",
          active ? "text-gray-12" : "text-gray-8"
        )}
      >
        {formatTokenValue(balance, decimals, {
          min: 0.0001,
          fractionDigits: 4,
        })}
      </div>

      {/* Full Balance Button */}
      <div className="shrink-0">{maxButtonSlot}</div>

      {/* 50% Balance Button */}
      <div className="shrink-0">{halfButtonSlot}</div>

      {/* Transit Balance */}
      {transitBalance ? (
        <TooltipInfo
          icon={
            <button
              type="button"
              className="flex items-center gap-1 rounded-full bg-gray-300/50 px-2 py-0.5"
            >
              <div className="w-3 h-3 bg-[url('/static/images/process.gif')] bg-no-repeat bg-contain" />
              <span className="text-xs font-bold text-gray-11">
                {formatTokenValue(
                  transitBalance.amount,
                  transitBalance.decimals,
                  {
                    min: 0.0001,
                    fractionDigits: 4,
                  }
                )}
              </span>
            </button>
          }
        >
          Deposit is in progress and will be available shortly.
          <br />
          <br />
          Note: Deposits of the same token are queued and added in order.
        </TooltipInfo>
      ) : null}
    </div>
  )
}

interface ButtonProps {
  onClick?: () => void
  disabled?: boolean
  balance: bigint
}

BlockMultiBalances.DisplayMaxButton = function DisplayMaxButton({
  onClick,
  balance,
  disabled,
}: ButtonProps) {
  const active = balance > 0n && !disabled
  return (
    <Button
      variant="outline"
      size="1"
      color="gray"
      radius="full"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
      className="text-xs font-bold leading-4 min-w-[32px] md:min-w-[36px]"
      disabled={!active}
    >
      Max
    </Button>
  )
}

BlockMultiBalances.DisplayHalfButton = function DisplayHalfButton({
  onClick,
  balance,
  disabled,
}: ButtonProps) {
  const active = balance > 0n && !disabled
  return (
    <Button
      variant="outline"
      size="1"
      color="gray"
      radius="full"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
      className="text-xs font-bold leading-4 min-w-[32px] md:min-w-[36px]"
      disabled={!active}
    >
      50%
    </Button>
  )
}
