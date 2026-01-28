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
  const hasUsdAmount = usdAmount !== null && usdAmount > 0
  const hasValue = value && value !== "0" && value !== ""

  const handleBalanceClick = () => {
    if (!disabled && hasBalance) {
      handleSetPercentage(100)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-3xl w-full p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          autoComplete="off"
          placeholder={`Enter amount ${symbol}`}
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
        <span className="text-4xl font-bold text-gray-500 shrink-0">
          {symbol}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-gray-500 font-medium">
          {hasUsdAmount ? formatUsdAmount(usdAmount) : "$0.00"}
        </div>

        <div className="flex items-center gap-2">
          {hasBalance && (
            <button
              type="button"
              onClick={handleBalanceClick}
              disabled={disabled}
              className={clsx(
                "text-sm text-gray-500 font-medium text-right",
                !disabled && "hover:text-gray-700 cursor-pointer"
              )}
            >
              {formatTokenValue(balance, decimals, {
                min: 0.0001,
                fractionDigits: 4,
              })}{" "}
              {symbol}
            </button>
          )}
          {additionalInfo}
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

export default SelectedTokenInput
