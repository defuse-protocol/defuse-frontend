import Button from "@src/components/Button"
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

type BaseTokenInputCardProps = {
  label: string
  balance: bigint
  decimals: number
  symbol: string
  balanceInTransit?: bigint
  handleSetMax?: () => void
  usdAmount: number | null
  disabled?: boolean
  loading?: boolean
  selectedToken: TokenInfo
  tokens: TokenInfo[]
  handleSelectToken: () => void
  selectAssetsTestId?: string
  readOnly?: boolean
  error?: string
}

type WithRegistration = BaseTokenInputCardProps & {
  registration: UseFormRegisterReturn
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
}

type WithControlled = BaseTokenInputCardProps & {
  registration?: undefined
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}

type TokenInputCardProps = WithRegistration | WithControlled

const TokenInputCard = ({
  label,
  balance,
  decimals,
  symbol,
  balanceInTransit,
  usdAmount,
  handleSetMax,
  disabled,
  loading,
  registration,
  selectedToken,
  tokens,
  handleSelectToken,
  selectAssetsTestId,
  readOnly,
  error,
  value,
  onChange,
}: TokenInputCardProps) => {
  const id = useId()
  const noBalance = balance === 0n
  const hasBalanceInTransit = balanceInTransit != null && balanceInTransit > 0n

  return (
    <div className="bg-white border border-gray-200 rounded-3xl w-full p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-base text-gray-500 font-medium">
          {label}
        </label>

        <div className="flex items-center gap-2">
          {symbol && (
            <div className="text-base text-gray-500 text-right font-medium">
              {formatTokenValue(balance, decimals, {
                fractionDigits: 6,
              })}{" "}
              {symbol}
            </div>
          )}

          {hasBalanceInTransit && (
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
                    {formatTokenValue(balanceInTransit, decimals, {
                      min: 0.0001,
                      fractionDigits: 4,
                    })}{" "}
                    {symbol} is in progress and will be available shortly.
                    <Tooltip.Arrow className="ml-2" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            </Tooltip.Provider>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <SelectAssets
          selected={selectedToken ?? undefined}
          dataTestId={selectAssetsTestId}
          disabled={disabled}
          handleSelect={handleSelectToken}
          tokens={tokens}
        />
        {handleSetMax && (
          <Button
            variant="secondary"
            size="md"
            onClick={handleSetMax}
            disabled={disabled || noBalance}
          >
            Max
          </Button>
        )}
      </div>

      <div className="flex justify-between items-end gap-4">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          pattern="[0-9]*[.]?[0-9]*"
          autoComplete="off"
          placeholder="0"
          disabled={disabled}
          aria-busy={loading || undefined}
          readOnly={readOnly}
          className={clsx(
            "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full",
            disabled && "opacity-50"
          )}
          {...(registration ?? { value, onChange })}
          {...(registration && value !== undefined ? { value } : {})}
          {...(registration && onChange !== undefined ? { onChange } : {})}
        />
        <div className="text-right text-base text-gray-500 font-medium">
          {formatUsdAmount(usdAmount ?? 0)}
        </div>
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </div>
  )
}

export default TokenInputCard
