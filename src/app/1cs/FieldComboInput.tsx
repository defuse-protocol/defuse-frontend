import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { CaretDownIcon } from "@radix-ui/react-icons"
import { Skeleton } from "@radix-ui/themes"
import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import {
  BlockMultiBalances,
  type BlockMultiBalancesProps,
} from "@src/components/DefuseSDK/components/Block/BlockMultiBalances"
import useMergedRef from "@src/components/DefuseSDK/hooks/useMergedRef"
import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { TOKEN_ICONS } from "@src/constants/tokens"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import type React from "react"
import type {
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  RegisterOptions,
  UseFormRegister,
} from "react-hook-form"
import { formatUnits } from "viem"

interface Props<T extends FieldValues>
  extends Omit<BlockMultiBalancesProps, "decimals" | "balance"> {
  fieldName: Path<T>
  register?: UseFormRegister<T>
  required?: boolean
  min?: RegisterOptions["min"]
  max?: RegisterOptions["max"]
  placeholder?: string
  balance?: TokenValue
  transitBalance?: TokenValue
  selected?: TokenResponse
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
          <SelectAssets selected={selected} handleSelect={handleSelect} />
        )}
      </div>

      <div className="flex justify-between items-center min-h-6 gap-2 min-w-0">
        {isLongLoading && (
          <div className="text-xs sm:text-sm font-medium text-gray-400">
            Requesting a quote...
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

/**
 * Sets a value after a delay
 */
function useThrottledValue<T>(value: T, delayMs: number): T {
  const [throttledValue, setThrottledValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setThrottledValue(value)
    }, delayMs)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delayMs])

  return throttledValue
}

type SelectAssetsProps = {
  selected?: TokenResponse
  handleSelect?: () => void
}

const EmptyIcon = () => {
  return (
    <span className="relative min-w-[36px] min-h-[36px] bg-gray-200 rounded-full" />
  )
}

const SelectAssets = ({ selected, handleSelect }: SelectAssetsProps) => {
  const handleAssetsSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleSelect?.()
  }
  return (
    <button
      type="button"
      onClick={handleAssetsSelect}
      className="max-w-[148px] md:max-w-[210px] bg-gray-1 shadow-select-token rounded-full flex justify-between items-center p-1 gap-2.5 dark:shadow-select-token-dark"
    >
      {selected?.assetId ? (
        <AssetComboIcon
          icon={TOKEN_ICONS[selected.assetId]}
          name={`${selected.symbol} (${selected.blockchain})`}
          chainName={selected.blockchain}
        />
      ) : (
        <EmptyIcon />
      )}
      <span className="text-sm uppercase truncate">
        {selected?.symbol || "select token"} ({selected?.blockchain})
      </span>
      <CaretDownIcon width={25} height={25} />
    </button>
  )
}
