import Button from "@src/components/Button"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import ErrorMessage from "@src/components/ErrorMessage"
import clsx from "clsx"
import type { ReactNode } from "react"
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
}: SelectedTokenInputProps) => {
  const hasBalance = balance > 0n
  const hasValue = Boolean(value)

  const handleSetMax = () => {
    if (!disabled && hasBalance) {
      handleSetPercentage(100)
    }
  }

  const getPlaceholder = () => {
    return symbol ? `Enter amount ${symbol}` : "Enter amount"
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
          <label className="sr-only" htmlFor="deposit-amount">
            {label}
          </label>
          <input
            id="deposit-amount"
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
            maxLength={11}
            placeholder={getPlaceholder()}
            aria-label={label}
            disabled={disabled}
            className={clsx(
              "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight w-full min-w-0",
              !hasValue && "placeholder:text-xl placeholder:font-medium",
              hasValue && "placeholder:text-gray-400",
              disabled && "opacity-50"
            )}
            {...registration}
          />
        </div>

        <span className="text-xl font-bold text-gray-500 shrink-0">
          {symbol}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500 font-medium">
          {formatUsdAmount(usdAmount ?? 0)}
        </div>

        <div className="flex items-center gap-2">
          {hasBalance && (
            <button
              type="button"
              onClick={handleSetMax}
              disabled={disabled}
              className={clsx(
                "text-sm text-gray-500 font-medium text-right",
                !disabled && "hover:text-gray-700 cursor-pointer"
              )}
            >
              Balance:{" "}
              {formatTokenValue(balance, decimals, {
                min: 0.0001,
                fractionDigits: 4,
              })}
            </button>
          )}

          {additionalInfo}

          {hasBalance && (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => handleSetPercentage(50)}
              >
                50%
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => handleSetPercentage(100)}
              >
                Max
              </Button>
            </div>
          )}
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

export default SelectedTokenInput
