import { PencilSimpleIcon } from "@phosphor-icons/react"
import { TooltipInfo } from "@src/components/DefuseSDK/components/TooltipInfo"
import clsx from "clsx"
import { type ReactNode, useCallback, useRef, useState } from "react"
import type { TokenValue } from "../../../types/base"
import { formatTokenValue } from "../../../utils/format"

export interface BlockMultiBalancesProps {
  balance: bigint
  transitBalance?: TokenValue
  decimals: number
  className?: string
  maxButtonSlot?: ReactNode
  halfButtonSlot?: ReactNode
  customPercentButtonSlot?: ReactNode
  onBalanceClick?: () => void
}

export function BlockMultiBalances({
  balance,
  transitBalance,
  decimals,
  className,
  maxButtonSlot,
  halfButtonSlot,
  customPercentButtonSlot,
  onBalanceClick,
}: BlockMultiBalancesProps) {
  const active = balance > 0n
  const clickable = active && onBalanceClick != null

  return (
    <div
      className={clsx(
        "flex items-center gap-1.5 md:gap-2 min-w-0 min-h-6",
        className
      )}
    >
      {clickable ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            e.preventDefault()
            onBalanceClick()
          }}
          className={clsx(
            "text-xs font-semibold truncate min-w-0 transition-all duration-150",
            "text-gray-600 hover:text-gray-900",
            "hover:underline hover:underline-offset-2",
            "active:scale-95"
          )}
        >
          {formatTokenValue(balance, decimals, {
            min: 0.0001,
            fractionDigits: 4,
          })}
        </button>
      ) : (
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
      )}

      {/* Buttons container */}
      <div className="flex items-center gap-1">
        {customPercentButtonSlot}
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

interface CustomPercentButtonProps {
  onPercentChange: (percent: number) => void
  onPercentApply: () => void
  disabled?: boolean
  balance: bigint
  customPercent: number | null
  isSelected?: boolean
}

BlockMultiBalances.DisplayCustomPercentButton =
  function DisplayCustomPercentButton({
    onPercentChange,
    onPercentApply,
    balance,
    disabled,
    customPercent,
    isSelected,
  }: CustomPercentButtonProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const active = balance > 0n && !disabled
    const hasStoredPercent = customPercent != null && customPercent > 0

    const handleButtonClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (!active) return

        if (hasStoredPercent && !isSelected) {
          onPercentApply()
        } else {
          setIsEditing(true)
          setInputValue(hasStoredPercent ? String(customPercent) : "")
          setTimeout(() => inputRef.current?.focus(), 0)
        }
      },
      [active, hasStoredPercent, isSelected, customPercent, onPercentApply]
    )

    const handleEditClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation()
        e.preventDefault()
        if (!active) return
        setIsEditing(true)
        setInputValue(hasStoredPercent ? String(customPercent) : "")
        setTimeout(() => inputRef.current?.focus(), 0)
      },
      [active, hasStoredPercent, customPercent]
    )

    const handleSubmit = useCallback(() => {
      const percent = Number.parseFloat(inputValue)
      if (!Number.isNaN(percent) && percent > 0 && percent <= 100) {
        onPercentChange(percent)
      }
      setIsEditing(false)
      setInputValue("")
    }, [inputValue, onPercentChange])

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
          e.preventDefault()
          handleSubmit()
        } else if (e.key === "Escape") {
          setIsEditing(false)
          setInputValue("")
        } else if (e.key === "ArrowUp") {
          e.preventDefault()
          const current = Number.parseFloat(inputValue) || 0
          const newVal = Math.min(100, current + 1)
          setInputValue(String(newVal))
        } else if (e.key === "ArrowDown") {
          e.preventDefault()
          const current = Number.parseFloat(inputValue) || 0
          const newVal = Math.max(1, current - 1)
          setInputValue(String(newVal))
        }
      },
      [handleSubmit, inputValue]
    )

    const handleBlur = useCallback(() => {
      if (inputValue) {
        handleSubmit()
      } else {
        setIsEditing(false)
      }
    }, [inputValue, handleSubmit])

    const handleSelectedKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === "ArrowUp") {
          e.preventDefault()
          const newVal = Math.min(100, (customPercent ?? 0) + 1)
          onPercentChange(newVal)
        } else if (e.key === "ArrowDown") {
          e.preventDefault()
          const newVal = Math.max(1, (customPercent ?? 0) - 1)
          onPercentChange(newVal)
        } else if (e.key === "Enter") {
          e.preventDefault()
          handleEditClick(e as unknown as React.MouseEvent)
        }
      },
      [customPercent, onPercentChange, handleEditClick]
    )

    if (isEditing) {
      return (
        <div className="flex items-center gap-0.5">
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            value={inputValue}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9.]/g, "")
              setInputValue(val)
            }}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder="25"
            className="w-8 px-1 py-1 rounded-l-full bg-gray-100 text-xs font-semibold text-gray-700 text-center outline-none focus:bg-gray-200"
          />
          <span className="px-1.5 py-1 rounded-r-full bg-gray-100 text-xs font-semibold text-gray-500">
            %
          </span>
        </div>
      )
    }

    if (hasStoredPercent && isSelected) {
      return (
        <button
          type="button"
          onClick={handleEditClick}
          onKeyDown={handleSelectedKeyDown}
          disabled={!active}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-xs font-semibold hover:bg-gray-700 active:scale-95 transition-all duration-150"
        >
          {customPercent}%
          <PencilSimpleIcon weight="bold" className="size-3" />
        </button>
      )
    }

    return (
      <button
        type="button"
        onClick={handleButtonClick}
        className={clsx(
          "px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1 min-h-6",
          !active && "bg-gray-100 text-gray-400 cursor-not-allowed",
          active &&
            hasStoredPercent &&
            "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95",
          active &&
            !hasStoredPercent &&
            "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
        )}
        disabled={!active}
      >
        {hasStoredPercent ? (
          `${customPercent}%`
        ) : (
          <PencilSimpleIcon weight="bold" className="size-3" />
        )}
      </button>
    )
  }
