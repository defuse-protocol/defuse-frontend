import Alert from "@src/components/Alert"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import ErrorMessage from "@src/components/ErrorMessage"
import clsx from "clsx"
import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import { hexToRgba, useDominantColor } from "../../../../hooks/useDominantColor"

type SelectedTokenInputProps = {
  label: string
  value: string
  symbol: string
  icon: string
  balance: bigint
  decimals: number
  error?: string
  disabled?: boolean
  usdAmount: number | null
  additionalInfo?: ReactNode
  registration: UseFormRegisterReturn
  handleSetPercentage: (percent: number) => void
  isNativeToken?: boolean
  networkName?: string
}

const SelectedTokenInput = ({
  label,
  value,
  symbol,
  icon,
  balance,
  decimals,
  error,
  disabled,
  usdAmount,
  additionalInfo,
  registration,
  handleSetPercentage,
  isNativeToken = false,
  networkName,
}: SelectedTokenInputProps) => {
  const hasBalance = balance > 0n
  const hasValue = Boolean(value)

  const handleSetMax = () => {
    if (!disabled && hasBalance) {
      handleSetPercentage(100)
    }
  }

  // Check if user is trying to deposit full balance of native token
  const isFullBalanceNativeDeposit = (() => {
    if (!isNativeToken || !hasValue || balance === 0n) return false
    const inputValue = Number.parseFloat(value.replace(",", "."))
    if (Number.isNaN(inputValue) || inputValue === 0) return false
    const balanceFormatted = formatTokenValue(balance, decimals, {
      min: 0,
      fractionDigits: decimals,
    })
    const balanceValue = Number.parseFloat(balanceFormatted)
    // Show warning when input is >= 99% of balance
    return inputValue >= balanceValue * 0.99
  })()

  // Filter input to only allow numbers and one decimal point
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(",", ".").replace(/[^0-9.]/g, "")

    const parts = value.split(".")
    if (parts.length > 2) {
      value = `${parts[0]}.${parts.slice(1).join("")}`
    }

    e.target.value = value
    registration.onChange(e)
  }

  const { hex } = useDominantColor(icon)

  return (
    <div>
      <div
        className={clsx(
          "bg-white border rounded-3xl w-full p-4 sm:p-6 flex flex-col gap-3",
          error ? "border-red-500 ring-1 ring-red-500" : "border-gray-200"
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
              placeholder={`Enter amount ${symbol}`}
              aria-label={label}
              disabled={disabled}
              className={clsx(
                "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-3xl sm:text-4xl tracking-tight w-full min-w-0",
                !hasValue &&
                  "placeholder:text-xl sm:placeholder:text-2xl placeholder:font-semibold tracking-tight placeholder:text-gray-300 placeholder:-translate-y-0.5 sm:placeholder:-translate-y-1.25",
                hasValue && "placeholder:text-gray-400",
                disabled && "opacity-50"
              )}
              {...registration}
              onChange={handleInputChange}
            />
          </div>

          <div
            className="rounded-full outline-1 outline-gray-900/10 -outline-offset-1 flex items-center gap-1.5 p-1 pr-3 transition-colors"
            style={{
              backgroundColor: hexToRgba(hex, 0.07) ?? undefined,
            }}
          >
            <AssetComboIcon icon={icon} sizeClassName="size-7" />
            <span className="text-base text-gray-900 font-semibold leading-none">
              {symbol}
            </span>
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm text-gray-500 font-medium">
            {formatUsdAmount(usdAmount ?? 0)}
          </div>

          <div className="flex items-center gap-2">
            {additionalInfo}

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
                {formatTokenValue(balance, decimals, {
                  min: 0.0001,
                  fractionDigits: 4,
                })}{" "}
                {symbol}
              </button>
            )}
          </div>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
      {isFullBalanceNativeDeposit && networkName && (
        <Alert variant="warning" className="mt-2">
          {symbol} is the native token of {networkName}. If you deposit your
          full balance, you will have nothing available to pay for transaction
          fees.
        </Alert>
      )}
    </div>
  )
}

export default SelectedTokenInput
