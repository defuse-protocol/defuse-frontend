import { ArrowsUpDownIcon } from "@heroicons/react/16/solid"
import SelectAssets from "@src/components/DefuseSDK/components/SelectAssets"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import ErrorMessage from "@src/components/ErrorMessage"
import Spinner from "@src/components/Spinner"
import clsx from "clsx"
import { Tooltip } from "radix-ui"
import { useId } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"

type InputRegistration =
  | UseFormRegisterReturn
  | {
      name: string
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
      value: string
      onBlur?: () => void
      ref?: (instance: HTMLInputElement | null) => void
    }

type BaseTokenInputCardProps = {
  balance: bigint
  decimals: number
  symbol: string
  balanceInTransit?: bigint
  usdAmount: number | null
  disabled?: boolean
  loading?: boolean
  selectedToken: TokenInfo
  selectAssetsTestId?: string
  error?: string
  hasError?: boolean
  isUsdMode?: boolean
  tokenPrice?: number | null
  onToggleUsdMode?: () => void
  tokenAmount?: string
  isOutputField?: boolean
}

type InteractiveTokenInputCardProps = BaseTokenInputCardProps & {
  registration: InputRegistration
  tokens: TokenInfo[]
  handleSelectToken: () => void
  handleSetMax?: () => void
  readOnly?: boolean
  value?: never
}

type DisplayOnlyTokenInputCardProps = BaseTokenInputCardProps & {
  readOnly: true
  value: string
  registration?: never
  tokens?: TokenInfo[]
  handleSelectToken?: () => void
  handleSetMax?: never
}

type TokenInputCardProps =
  | InteractiveTokenInputCardProps
  | DisplayOnlyTokenInputCardProps

interface BalanceInTransitIndicatorProps {
  amount: bigint
  decimals: number
  symbol: string
}

function BalanceInTransitIndicator({
  amount,
  decimals,
  symbol,
}: BalanceInTransitIndicatorProps) {
  return (
    <Tooltip.Provider delayDuration={0}>
      <Tooltip.Root>
        <Tooltip.Trigger
          type="button"
          className="size-6 rounded flex items-center justify-center hover:bg-gray-100 text-gray-500 hover:text-gray-700"
        >
          <Spinner size="sm" />
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            side="bottom"
            align="end"
            sideOffset={4}
            className="bg-gray-900 rounded-xl shadow-lg flex px-3 py-2 gap-1 data-[state=open]:animate-in data-[state=open]:slide-in-from-top-1 duration-200 ease-in-out fade-in text-white text-xs max-w-48 font-medium"
          >
            Deposit of{" "}
            {formatTokenValue(amount, decimals, {
              min: 0.0001,
              fractionDigits: 4,
            })}{" "}
            {symbol} is in progress and will be available shortly.
            <Tooltip.Arrow className="ml-2" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

interface UsdToggleProps {
  isUsdMode: boolean
  usdAmount: number | null
  tokenAmount: string
  symbol: string
  onToggle: () => void
}

function UsdToggle({
  isUsdMode,
  usdAmount,
  tokenAmount,
  symbol,
  onToggle,
}: UsdToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-1.5 text-sm text-gray-500 font-medium hover:text-gray-700 transition-colors"
    >
      <span>
        {isUsdMode
          ? `${truncateDisplayValue(tokenAmount) || "0"} ${symbol}`
          : formatUsdAmount(usdAmount ?? 0)}
      </span>
      <ArrowsUpDownIcon className="size-4" />
    </button>
  )
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

const TokenInputCard = (props: TokenInputCardProps) => {
  const {
    balance,
    decimals,
    symbol,
    balanceInTransit,
    usdAmount,
    disabled,
    loading,
    selectedToken,
    tokens,
    handleSelectToken,
    selectAssetsTestId,
    readOnly,
    error,
    hasError = false,
    isUsdMode = false,
    tokenPrice,
    onToggleUsdMode,
    tokenAmount = "",
    isOutputField = false,
  } = props

  const isDisplayOnly = "value" in props && props.value !== undefined
  const handleSetMax = isDisplayOnly ? undefined : props.handleSetMax
  const isOutput = isOutputField || readOnly

  // Truncate output values, never truncate input values
  const registration = (() => {
    const reg = isDisplayOnly ? undefined : props.registration
    if (!reg || !isOutput || !("value" in reg)) return reg
    return { ...reg, value: truncateDisplayValue(reg.value) }
  })()

  const value = isDisplayOnly
    ? truncateDisplayValue(props.value ?? "")
    : undefined

  const id = useId()
  const noBalance = balance === 0n
  const hasBalanceInTransit = balanceInTransit != null && balanceInTransit > 0n

  const isSourceToken = !isDisplayOnly && !readOnly && !isOutputField
  const canToggleUsd = Boolean(
    isSourceToken && onToggleUsdMode && tokenPrice != null && tokenPrice > 0
  )

  const handleBalanceClick = () => {
    if (handleSetMax && !disabled && !noBalance) {
      handleSetMax()
    }
  }

  const getPlaceholder = () => {
    if (isDisplayOnly || readOnly || isOutputField) {
      return "0"
    }
    if (isUsdMode) {
      return "Enter amount USD"
    }
    return symbol ? `Enter amount ${symbol}` : "Enter amount"
  }

  const getAriaLabel = () => {
    if (isDisplayOnly || readOnly || isOutputField) {
      return symbol ? `${symbol} amount to receive` : "Amount to receive"
    }
    if (isUsdMode) {
      return "Enter amount in USD"
    }
    return symbol ? `Enter amount in ${symbol}` : "Enter amount"
  }

  const hasValue = Boolean(
    (registration && "value" in registration && registration.value) || value
  )

  return (
    <div
      className={clsx(
        "bg-white border rounded-3xl w-full p-6 flex flex-col gap-3",
        hasError ? "border-red-500" : "border-gray-200"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-1 flex-1 min-w-0">
          {isUsdMode && hasValue && (
            <span className="font-bold text-gray-900 text-4xl tracking-tight shrink-0">
              $
            </span>
          )}
          <input
            id={id}
            type="text"
            inputMode="decimal"
            pattern="[0-9]*[.]?[0-9]*"
            autoComplete="off"
            placeholder={getPlaceholder()}
            aria-label={getAriaLabel()}
            disabled={disabled}
            aria-busy={loading || undefined}
            readOnly={readOnly}
            className={clsx(
              "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight w-full min-w-0 font-sans",
              !hasValue && "placeholder:text-xl placeholder:font-medium",
              hasValue && "placeholder:text-gray-400",
              disabled && "opacity-50"
            )}
            {...(registration ?? { value, readOnly: true })}
          />
        </div>

        <SelectAssets
          selected={selectedToken ?? undefined}
          dataTestId={selectAssetsTestId}
          disabled={disabled}
          handleSelect={handleSelectToken ?? undefined}
          tokens={tokens}
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        {canToggleUsd && onToggleUsdMode ? (
          <UsdToggle
            isUsdMode={isUsdMode}
            usdAmount={usdAmount}
            tokenAmount={tokenAmount}
            symbol={symbol}
            onToggle={onToggleUsdMode}
          />
        ) : (
          <div className="text-sm text-gray-500 font-medium">
            {isUsdMode
              ? `${truncateDisplayValue(tokenAmount) || "0"} ${symbol}`
              : formatUsdAmount(usdAmount ?? 0)}
          </div>
        )}

        <div className="flex items-center gap-2">
          {symbol && (
            <button
              type="button"
              onClick={handleBalanceClick}
              disabled={disabled || noBalance || !handleSetMax}
              className={clsx(
                "text-sm text-gray-500 font-medium text-right",
                handleSetMax &&
                  !disabled &&
                  !noBalance &&
                  "hover:text-gray-700 cursor-pointer"
              )}
            >
              {formatTokenValue(balance, decimals, { fractionDigits: 6 })}{" "}
              {symbol}
            </button>
          )}
          {hasBalanceInTransit && balanceInTransit && (
            <BalanceInTransitIndicator
              amount={balanceInTransit}
              decimals={decimals}
              symbol={symbol}
            />
          )}
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

export default TokenInputCard
