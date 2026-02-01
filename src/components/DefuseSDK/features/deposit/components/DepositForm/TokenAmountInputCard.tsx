import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { cn } from "@src/utils/cn"
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"

export function TokenAmountInputCard({
  variant,
  tokenSlot,
  inputSlot,
  balanceSlot,
  priceSlot,
  labelSlot,
  infoSlot,
}: {
  variant?: "2"
  tokenSlot?: ReactNode
  inputSlot?: ReactNode
  balanceSlot?: ReactNode
  priceSlot?: ReactNode
  labelSlot?: ReactNode
  infoSlot?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-border bg-gray-2 p-3 md:p-4 min-w-0 w-full",
        variant === "2" &&
          "rounded-[10px] border-0 bg-gray-3 hover:bg-gray-4 focus-within:bg-gray-4"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Label */}
        <div>{labelSlot}</div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 min-w-0">
        {/* Amount Input */}
        <div className="relative flex-1 min-w-0">
          <div className="overflow-hidden">{inputSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 md:w-12 bg-transparent" />
        </div>

        {/* Token Selector */}
        <div className="shrink-0 min-w-0">{tokenSlot}</div>
      </div>

      <div className="flex items-center justify-between gap-2 md:gap-4 min-w-0">
        {/* Info or Price Slot */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap min-w-0">
          <div className="truncate">{infoSlot ?? priceSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-8 md:w-12 bg-transparent" />
        </div>

        {/* Balance */}
        <div className="shrink-0 min-w-0">{balanceSlot}</div>
      </div>
    </div>
  )
}

TokenAmountInputCard.Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { isLoading?: boolean }
>(function Input({ isLoading, className, disabled, ...rest }, ref) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.]?[0-9]*"
      autoComplete="off"
      placeholder="0"
      disabled={disabled}
      aria-busy={isLoading || undefined}
      className={cn(
        "relative p-0 outline-hidden border-0 bg-transparent outline-none focus:ring-0 font-bold text-gray-900 text-4xl tracking-tight placeholder:text-gray-400 w-full font-sans",
        disabled && "opacity-50",
        className
      )}
      {...rest}
    />
  )
})

TokenAmountInputCard.DisplayToken = function DisplayToken({
  token,
}: { token: TokenInfo }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <AssetComboIcon
        icon={token.icon}
        chainName={isBaseToken(token) ? token.originChainName : undefined}
      />

      <div className="font-bold text-label text-xs md:text-sm truncate max-w-[60px] md:max-w-none">
        {token.symbol}
      </div>
    </div>
  )
}

TokenAmountInputCard.Label = function Label({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  return (
    <label htmlFor={id} className="text-base text-gray-500">
      {children}
    </label>
  )
}

TokenAmountInputCard.DisplayPrice = function DisplayPrice({
  children,
}: {
  children: ReactNode
}) {
  return <div className="text-right text-base text-gray-500">{children}</div>
}

TokenAmountInputCard.DisplayInfo = function DisplayInfo({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div className="font-medium text-gray-9 text-xs md:text-sm truncate">
      {children}
    </div>
  )
}
