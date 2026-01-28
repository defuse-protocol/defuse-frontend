import Button from "@src/components/Button"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import ErrorMessage from "@src/components/ErrorMessage"
import clsx from "clsx"
import { type ReactNode, useEffect, useRef, useState } from "react"
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
  const valueRef = useRef<HTMLDivElement>(null)
  const [valueWidth, setValueWidth] = useState(0)

  useEffect(() => {
    const element = valueRef.current
    if (!element) return

    const updateWidth = () => {
      const width = element.getBoundingClientRect().width
      setValueWidth(width)
    }

    const observer = new ResizeObserver(updateWidth)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  const size = value.length > 12 ? "xs" : value.length > 9 ? "sm" : "md"

  const inputValueClasses = clsx("font-bold text-right tracking-tight", {
    "text-6xl/15": size === "md",
    "text-5xl/15": size === "sm",
    "text-4xl/15": size === "xs",
  })

  const hasBalance = balance > 0n
  const hasUsdAmount = usdAmount !== null && usdAmount > 0

  return (
    <div className="bg-white border border-gray-200 rounded-3xl px-6 pt-10 pb-16 flex flex-col gap-2">
      <div className="min-h-6">
        {error ? (
          <ErrorMessage className="text-center">{error}</ErrorMessage>
        ) : hasUsdAmount ? (
          <div className="text-base text-gray-500 font-medium text-center">
            {formatUsdAmount(usdAmount)}
          </div>
        ) : null}
      </div>

      <label className="relative cursor-text overflow-hidden">
        <span className="sr-only">{label}</span>
        <div className="relative flex items-end justify-center gap-1 h-18">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
            placeholder="0"
            disabled={disabled}
            className={clsx(
              "bg-transparent p-0 outline-hidden border-0 outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400 max-w-88",
              inputValueClasses
            )}
            style={{ width: valueWidth }}
            {...registration}
          />
          <span
            className={clsx("text-xl/none font-bold text-gray-500", {
              "mb-3": size === "md",
              "mb-2.5": size === "sm",
              "mb-3.5": size === "xs",
            })}
          >
            {symbol}
          </span>
        </div>
        <span
          ref={valueRef}
          aria-hidden="true"
          className={clsx(
            "absolute left-0 top-0 inline-block invisible opacity-0 pointer-events-none whitespace-pre",
            inputValueClasses
          )}
        >
          {value || "0"}
        </span>
      </label>

      <div className="flex items-center justify-center gap-4">
        {hasBalance && (
          <div className="text-base text-gray-500 font-medium text-center">
            Balance:{" "}
            {formatTokenValue(balance, decimals, {
              min: 0.0001,
              fractionDigits: 4,
            })}
          </div>
        )}

        {additionalInfo && additionalInfo}

        {hasBalance && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSetPercentage(50)}
            >
              50%
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={() => handleSetPercentage(100)}
            >
              Max
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default SelectedTokenInput
