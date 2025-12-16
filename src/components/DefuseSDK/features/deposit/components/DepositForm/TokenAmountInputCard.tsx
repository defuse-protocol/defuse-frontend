import { Skeleton } from "@radix-ui/themes"
import { type InputHTMLAttributes, type ReactNode, forwardRef } from "react"
import { AssetComboIcon } from "../../../../components/Asset/AssetComboIcon"
import type { TokenInfo } from "../../../../types/base"
import { cn } from "../../../../utils/cn"
import { isBaseToken } from "../../../../utils/token"
export function TokenAmountInputCard({
  variant = "1",
  tokenSlot,
  inputSlot,
  balanceSlot,
  priceSlot,
  labelSlot,
  infoSlot,
}: {
  variant?: "1" | "2"
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
    <>
      {isLoading && (
        <Skeleton className="w-full absolute inset-y-0" height="40px" />
      )}
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
          "w-full border-0 bg-transparent relative p-0 font-medium text-2xl md:text-3xl text-label focus:ring-0 outline-hidden",
          isLoading && "z-[-1]",
          disabled && "opacity-50",
          className
        )}
        {...rest}
      />
    </>
  )
})

TokenAmountInputCard.DisplayToken = function DisplayToken({
  token,
}: { token: TokenInfo }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <AssetComboIcon
        icon={token.icon}
        name={token.name}
        chainName={isBaseToken(token) ? token.originChainName : undefined}
      />

      <div className="font-bold text-label text-xs md:text-sm truncate max-w-[60px] md:max-w-none">
        {token.symbol}
      </div>
    </div>
  )
}

TokenAmountInputCard.DisplayPrice = function DisplayPrice({
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
