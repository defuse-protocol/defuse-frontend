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
}: {
  variant?: "1" | "2"
  tokenSlot?: ReactNode
  inputSlot?: ReactNode
  balanceSlot?: ReactNode
  priceSlot?: ReactNode
  labelSlot?: ReactNode
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-2.5 rounded-lg border border-border bg-gray-2 p-4",
        variant === "2" &&
          "rounded-[10px] border-0 bg-gray-3 hover:bg-gray-4 focus-within:bg-gray-4"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Label */}
        <div>{labelSlot}</div>
      </div>

      <div className="flex items-center gap-4">
        {/* Amount Input */}
        <div className="relative flex-1">
          <div className="overflow-hidden">{inputSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-transparent" />
        </div>

        {/* Token Selector */}
        <div className="shrink-0">{tokenSlot}</div>
      </div>

      <div className="flex items-center justify-between gap-4">
        {/* Price */}
        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div>{priceSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-transparent" />
        </div>

        {/* Balance */}
        <div className="shrink-0">{balanceSlot}</div>
      </div>
    </div>
  )
}

TokenAmountInputCard.Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(function Input(props, ref) {
  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      pattern="[0-9]*[.]?[0-9]*"
      autoComplete="off"
      placeholder="0"
      className={cn(
        "w-full border-0 bg-transparent p-0 font-medium text-3xl text-label focus:ring-0 outline-none",
        props.disabled && "opacity-50"
      )}
      {...props}
    />
  )
})

TokenAmountInputCard.DisplayToken = function DisplayToken({
  token,
}: { token: TokenInfo }) {
  return (
    <div className="flex items-center gap-2">
      <AssetComboIcon
        icon={token.icon}
        name={token.name}
        chainName={isBaseToken(token) ? token.originChainName : undefined}
      />

      <div className="font-bold text-label text-sm">{token.symbol}</div>
    </div>
  )
}

TokenAmountInputCard.DisplayPrice = function DisplayPrice({
  children,
}: {
  children: ReactNode
}) {
  return <div className="font-medium text-gray-9 text-sm">{children}</div>
}
