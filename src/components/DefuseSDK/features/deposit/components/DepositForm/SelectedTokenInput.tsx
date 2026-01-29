import { ArrowsUpDownIcon } from "@heroicons/react/16/solid"
import SelectAssets from "@src/components/DefuseSDK/components/SelectAssets"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import ErrorMessage from "@src/components/ErrorMessage"
import clsx from "clsx"
import { type ReactNode, useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

type SelectedTokenInputProps = {
  label: string
  value: string
  symbol: string
  balance: bigint
  decimals: number
  error?: string
  disabled?: boolean
  usdAmount: number | null
  additionalInfo?: ReactNode
  registration: UseFormRegisterReturn
  handleSetPercentage: (percent: number) => void
  /** Optional token info for showing icon */
  selectedToken?: TokenInfo
  /** Optional callback for selecting a different token */
  handleSelectToken?: () => void
  /** Token price for USD toggle functionality */
  tokenPrice?: number | null
  /** Show loading state for token selector (e.g., while resolving correct token) */
  tokenLoading?: boolean
}

function truncateDisplayValue(value: string, maxLength = 8): string {
  if (!value || value.length <= maxLength) return value

  const num = Number.parseFloat(value)
  if (Number.isNaN(num)) return value

  if (num >= 1_000_000) {
    return num.toLocaleString("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    })
  }

  const [intPart, decPart] = value.split(".")
  if (!decPart) return value

  const availableDecimals = Math.max(0, maxLength - intPart.length - 1)
  if (availableDecimals === 0) return intPart

  return `${intPart}.${decPart.slice(0, availableDecimals)}`
}

const SelectedTokenInput = ({
  label,
  value,
  symbol,
  balance,
  decimals,
  error,
  disabled,
  usdAmount,
  additionalInfo,
  registration,
  handleSetPercentage,
  selectedToken,
  handleSelectToken,
  tokenPrice,
  tokenLoading,
}: SelectedTokenInputProps) => {
  const [isUsdMode, setIsUsdMode] = useState(false)
  const hasBalance = balance > 0n
  const hasUsdAmount = usdAmount !== null && usdAmount > 0
  const hasValue = value && value !== "0" && value !== ""

  // Can toggle USD mode if we have a token price
  const canToggleUsd = tokenPrice != null && tokenPrice > 0

  const handleBalanceClick = () => {
    if (!disabled && hasBalance) {
      handleSetPercentage(100)
    }
  }

  const handleToggleUsdMode = () => {
    if (canToggleUsd) {
      setIsUsdMode(!isUsdMode)
    }
  }

  return (
    <div
      className={clsx(
        "bg-white border rounded-3xl w-full p-6 flex flex-col gap-3",
        error ? "border-red-500" : "border-gray-200"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {isUsdMode && hasUsdAmount ? (
            // USD mode: show the USD amount as display-only
            <span className="font-bold text-gray-900 text-4xl tracking-tight">
              {formatUsdAmount(usdAmount)}
            </span>
          ) : (
            // Token mode: show editable input
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.]?[0-9]*"
              autoComplete="off"
              placeholder={
                tokenLoading ? "Enter amount" : `Enter amount ${symbol}`
              }
              aria-label={label}
              disabled={disabled}
              className={clsx(
                "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-sans font-bold text-gray-900 text-4xl tracking-tight w-full min-w-0",
                !hasValue && "placeholder:text-xl placeholder:font-medium",
                hasValue && "placeholder:text-gray-400",
                disabled && "opacity-50"
              )}
              {...registration}
            />
          )}
        </div>
        {tokenLoading ? (
          <div className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1 pr-3 animate-pulse">
            <div className="size-7 rounded-full bg-gray-200" />
            <div className="h-4 w-12 bg-gray-200 rounded" />
          </div>
        ) : selectedToken ? (
          <SelectAssets
            selected={selectedToken}
            handleSelect={handleSelectToken}
            disabled={disabled}
          />
        ) : (
          <span className="text-4xl font-bold text-gray-500 shrink-0">
            {symbol}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        {tokenLoading ? (
          <span className="inline-block h-4 w-12 bg-gray-200 rounded animate-pulse" />
        ) : canToggleUsd ? (
          <button
            type="button"
            onClick={handleToggleUsdMode}
            className="flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
          >
            <span>
              {isUsdMode
                ? `${truncateDisplayValue(value) || "0"} ${symbol}`
                : formatUsdAmount(usdAmount ?? 0)}
            </span>
            <ArrowsUpDownIcon className="size-4" />
          </button>
        ) : (
          <div className="text-sm text-gray-500 font-medium">
            {hasUsdAmount ? formatUsdAmount(usdAmount) : "$0.00"}
          </div>
        )}

        {/* Hidden input to maintain form state when in USD mode */}
        {isUsdMode && <input type="hidden" {...registration} />}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleBalanceClick}
            disabled={disabled || !hasBalance}
            className={clsx(
              "text-sm text-gray-500 font-medium text-right",
              !disabled && hasBalance && "hover:text-gray-700 cursor-pointer"
            )}
          >
            {tokenLoading ? (
              <span className="inline-block h-4 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              <>
                {formatTokenValue(balance, decimals, {
                  min: 0.0001,
                  fractionDigits: 4,
                })}{" "}
                {symbol}
              </>
            )}
          </button>
          {additionalInfo}
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

export default SelectedTokenInput
