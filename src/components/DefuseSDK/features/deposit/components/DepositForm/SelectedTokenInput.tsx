import { InformationCircleIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import TooltipNew from "@src/components/DefuseSDK/components/TooltipNew"
import { RESERVED_NEAR_BALANCE } from "@src/components/DefuseSDK/services/blockchainBalanceService"
import type { TokenDeployment } from "@src/components/DefuseSDK/types/base"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import { isFungibleToken } from "@src/components/DefuseSDK/utils/token"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

type SelectedTokenInputProps = {
  label: string
  value: string
  token: TokenDeployment
  symbol: string
  balance: bigint
  usdAmount: number | null
  disabled?: boolean
  isLoading?: boolean
  registration: UseFormRegisterReturn
  handleSetPercentage: (percent: number) => void
}

const SelectedTokenInput = ({
  label,
  value,
  token,
  symbol,
  balance,
  usdAmount,
  disabled,
  isLoading,
  registration,
  handleSetPercentage,
}: SelectedTokenInputProps) => {
  const valueRef = useRef<HTMLDivElement>(null)
  const [valueWidth, setValueWidth] = useState(0)

  const { decimals } = token

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

  const inputValueClasses = clsx("font-bold text-right tracking-tight", {
    "text-6xl/15": value.length <= 9,
    "text-5xl/15": value.length > 9 && value.length <= 12,
    "text-4xl/15": value.length > 12,
  })

  const hasBalance = balance > 0n

  return (
    <div className="bg-white border border-gray-200 rounded-3xl px-6 pt-10 pb-16 flex flex-col gap-2">
      <div className="h-6">
        {usdAmount !== null && usdAmount > 0 && (
          <div className="text-base text-gray-500 font-medium text-center self-center">
            {formatUsdAmount(usdAmount)}
          </div>
        )}
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
            aria-busy={isLoading || undefined}
            className={clsx(
              "bg-transparent p-0 outline-hidden border-0 outline-none focus:ring-0 text-gray-900 placeholder:text-gray-400 max-w-88",
              inputValueClasses
            )}
            style={{ width: valueWidth }}
            {...registration}
          />
          <span
            className={clsx("text-xl/none font-bold text-gray-500", {
              "mb-3": value.length <= 9,
              "mb-2.5": value.length > 9 && value.length <= 12,
              "mb-3.5": value.length > 12,
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

      {hasBalance && (
        <div className="flex items-center justify-center gap-4">
          <div className="text-base text-gray-500 font-medium text-center">
            Balance:{" "}
            {formatTokenValue(balance, decimals, {
              min: 0.0001,
              fractionDigits: 4,
            })}
          </div>

          {isFungibleToken(token) && token.address === "wrap.near" && (
            <TooltipNew>
              <TooltipNew.Trigger>
                <button
                  type="button"
                  className="flex items-center justify-center size-6 rounded-lg shrink-0 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                  aria-label="Additional information"
                >
                  <InformationCircleIcon className="size-4" />
                </button>
              </TooltipNew.Trigger>
              <TooltipNew.Content className="max-w-72 text-center text-balance">
                Combined balance of NEAR and wNEAR. NEAR will be automatically
                wrapped to wNEAR if your wNEAR balance isn't sufficient for the
                swap.
                <br />
                <br />
                Note that to cover network fees, we reserve
                {` ${formatTokenValue(RESERVED_NEAR_BALANCE, decimals)} NEAR `}
                in your wallet.
              </TooltipNew.Content>
            </TooltipNew>
          )}

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
        </div>
      )}
    </div>
  )
}

export default SelectedTokenInput
