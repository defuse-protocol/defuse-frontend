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
      className={clsx(
        "flex items-center gap-1.5 md:gap-2 min-w-0 min-h-6",
        className
      )}
    >
      {/* Balance */}
      <div
        className={clsx(
          "text-xs font-semibold truncate min-w-0",
          active ? "text-gray-600" : "text-gray-400"
        )}
      >
        {formatTokenValue(balance, decimals, {
          min: 0.0001,
          fractionDigits: 4,
        })}
      </div>

      {/* Buttons container */}
      <div className="flex items-center gap-1">
        {halfButtonSlot}
        {maxButtonSlot}
      </div>

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
  selected?: boolean
}

BlockMultiBalances.DisplayMaxButton = function DisplayMaxButton({
  onClick,
  balance,
  disabled,
  selected,
}: ButtonProps) {
  const active = balance > 0n && !disabled
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
      className={clsx(
        "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150",
        !active && "bg-gray-100 text-gray-400 cursor-not-allowed",
        active &&
          selected &&
          "bg-gray-900 text-white hover:bg-gray-700 active:scale-95",
        active &&
          !selected &&
          "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
      )}
      disabled={!active}
    >
      Max
    </button>
  )
}

BlockMultiBalances.DisplayHalfButton = function DisplayHalfButton({
  onClick,
  balance,
  disabled,
  selected,
}: ButtonProps) {
  const active = balance > 0n && !disabled
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        e.preventDefault()
        onClick?.()
      }}
      className={clsx(
        "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150",
        !active && "bg-gray-100 text-gray-400 cursor-not-allowed",
        active &&
          selected &&
          "bg-gray-900 text-white hover:bg-gray-700 active:scale-95",
        active &&
          !selected &&
          "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
      )}
      disabled={!active}
    >
      50%
    </button>
  )
}
