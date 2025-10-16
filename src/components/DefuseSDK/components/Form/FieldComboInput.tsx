import { Skeleton } from "@radix-ui/themes"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import { useThrottledValue } from "@src/hooks/useThrottledValue"
import clsx from "clsx"
import { useRef } from "react"
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form"
import { formatUnits } from "viem"
import useMergedRef from "../../hooks/useMergedRef"
import type { TokenInfo, TokenValue } from "../../types/base"
import {
  BlockMultiBalances,
  type BlockMultiBalancesProps,
} from "../Block/BlockMultiBalances"
import { SelectAssets } from "../SelectAssets"

interface Props<T extends FieldValues>
  extends Omit<BlockMultiBalancesProps, "decimals" | "balance"> {
  fieldName: Path<T>
  tokenIn: TokenInfo
  tokenOut?: TokenInfo
  register?: UseFormRegister<T>
  required?: boolean
  min?: RegisterOptions["min"]
  max?: RegisterOptions["max"]
  placeholder?: string
  balance?: TokenValue
  transitBalance?: TokenValue
  selected?: TokenInfo
  handleSelect?: () => void
  className?: string
  errors?: FieldErrors
  usdAmount?: string | null
  disabled?: boolean
  isLoading?: boolean
}

export const FieldComboInputRegistryName = "FieldComboInput"

export const FieldComboInput = <T extends FieldValues>({
  fieldName,
  tokenIn,
  tokenOut,
  register,
  required,
  min,
  max,
  placeholder = "0",
  balance,
  transitBalance,
  selected,
  handleSelect,
  className,
  errors,
  usdAmount,
  disabled,
  isLoading,
}: Props<T>) => {
  if (!register) {
    return null
  }

  const inputRef = useRef<HTMLInputElement>(null)

  const setInputValue = (
    value: string | ((previousValue: string) => string)
  ) => {
    if (inputRef.current) {
      const lastValue = inputRef.current.value

      inputRef.current.value =
        typeof value === "function" ? value(lastValue) : value

      // @ts-expect-error React hack for emitting change event
      const tracker = inputRef.current._valueTracker
      if (tracker) {
        tracker.setValue(lastValue)
      }

      const event = new Event("change", { bubbles: true })
      inputRef.current.dispatchEvent(event)
    }
  }

  const handleSetMaxValue = () => {
    if (!disabled && balance != null && selected && inputRef.current) {
      setInputValue(formatUnits(balance.amount, balance.decimals))
    }
  }

  const handleSetHalfValue = () => {
    if (!disabled && balance != null && selected && inputRef.current) {
      setInputValue(formatUnits(balance.amount / 2n, balance.decimals))
    }
  }

  // react-hook-form specific props
  const reactHookFormRegisterProps = register(fieldName, {
    min,
    max,
    pattern: {
      value: /^[0-9]*[,.]?[0-9]*$/, // Valid result "10", "1,0", "0.01", ".01"
      message: "Please enter a valid number",
    },
    required: required ? "This field is required" : false,
  })

  const allInputRefs = useMergedRef(inputRef, reactHookFormRegisterProps.ref)
  const fieldError = errors?.[fieldName]

  const LONG_LOADING_THRESHOLD_MS = 3000
  const isLongLoading = useThrottledValue(
    isLoading,
    isLoading ? LONG_LOADING_THRESHOLD_MS : 0
  )

  const tokens = useTokensStore((state) => state.tokens)

  return (
    <div
      className={clsx(
        "relative flex flex-col px-5 pt-5 pb-6 w-full bg-gray-2 dark:border-gray-4",
        className
      )}
    >
      <div className="flex justify-between items-center gap-2 h-15">
        {isLoading && <Skeleton className="w-full" height="40px" />}
        <div className="relative flex flex-1 overflow-hidden">
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[,.]?[0-9]*"
            {...reactHookFormRegisterProps}
            ref={allInputRefs}
            placeholder={placeholder}
            disabled={disabled}
            autoComplete="off"
            className={clsx(
              "w-full text-3xl font-medium border-transparent focus:border-transparent focus:ring-0 px-0 outline-none bg-transparent",
              disabled && "pointer-events-none",
              {
                hidden: isLoading,
              }
            )}
          />
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12" />
        </div>

        {selected && (
          <SelectAssets
            selected={selected}
            handleSelect={handleSelect}
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            tokens={tokens}
          />
        )}
      </div>

      <div className="flex justify-between items-center min-h-6 gap-2 min-w-0">
        {isLongLoading && (
          <div className="text-xs sm:text-sm font-medium text-gray-400">
            Searching for more liquidity...
          </div>
        )}

        <div className="relative flex flex-1 overflow-hidden whitespace-nowrap">
          {fieldError ? (
            <span className="text-xs sm:text-sm font-medium text-red-400">
              {(fieldError as FieldError).message}
            </span>
          ) : usdAmount ? (
            <span className="text-xs sm:text-sm font-medium text-gray-400">
              {usdAmount}
            </span>
          ) : null}
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-gradient-to-r from-transparent to-gray-2" />
        </div>

        {balance != null && (
          <BlockMultiBalances
            balance={balance.amount}
            decimals={balance.decimals}
            className="ml-auto"
            transitBalance={transitBalance}
            maxButtonSlot={
              <BlockMultiBalances.DisplayMaxButton
                onClick={handleSetMaxValue}
                balance={balance.amount}
                disabled={disabled}
              />
            }
            halfButtonSlot={
              <BlockMultiBalances.DisplayHalfButton
                onClick={handleSetHalfValue}
                balance={balance.amount}
                disabled={disabled}
              />
            }
          />
        )}
      </div>
    </div>
  )
}

FieldComboInput.displayName = FieldComboInputRegistryName
