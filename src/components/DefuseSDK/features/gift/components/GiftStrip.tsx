import type { ReactNode } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import type { TokenInfo, TokenValue } from "../../../types/base"
import { cn } from "../../../utils/cn"
import { formatTokenValue } from "../../../utils/format"
import { formatGiftDate } from "../utils/formattedDate"

type GiftStripProps = {
  token: TokenInfo
  amountSlot?: ReactNode
  dateSlot?: ReactNode
}

export function GiftStrip({ token, amountSlot, dateSlot }: GiftStripProps) {
  return (
    <div className="flex justify-between items-center gap-2.5 pr-2.5">
      <div className="flex items-center relative">
        <AssetComboIcon {...token} />
      </div>
      <div className="flex flex-col">
        <div className="relative overflow-hidden whitespace-nowrap">
          <div>{amountSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-transparent" />
        </div>
        <div className="relative overflow-hidden whitespace-nowrap">
          <div>{dateSlot}</div>
          <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-12 bg-transparent" />
        </div>
      </div>
    </div>
  )
}

GiftStrip.Amount = function DisplayAmount({
  token,
  amount,
  className,
}: {
  token: TokenInfo
  amount: TokenValue
  className?: string
}) {
  return (
    <div className={cn("text-sm text-black font-bold", className)}>
      {formatTokenValue(amount.amount, amount.decimals, { fractionDigits: 6 })}{" "}
      {token.symbol}
    </div>
  )
}

GiftStrip.Date = function DisplayDate({
  updatedAt,
  className,
}: {
  updatedAt: number
  className?: string
}) {
  const formattedDate = formatGiftDate(updatedAt)
  return (
    <div className={cn("text-xs text-neutral-11", className)}>
      {formattedDate}
    </div>
  )
}
