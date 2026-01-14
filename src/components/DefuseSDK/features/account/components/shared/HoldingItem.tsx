import { Skeleton } from "@radix-ui/themes"
import { AssetComboIcon } from "../../../../components/Asset/AssetComboIcon"
import { formatTokenValue } from "../../../../utils/format"
import type { Holding } from "../../types/sharedTypes"
import { FormattedCurrency } from "./FormattedCurrency"

interface HoldingItemProps {
  holding: Holding
  hideBalances?: boolean
}

export function HoldingItem({ holding, hideBalances }: HoldingItemProps) {
  const { token, value, usdValue } = holding

  const formatted = value
    ? formatTokenValue(value.amount, value.decimals)
    : undefined

  const shortFormatted = value
    ? formatTokenValue(value.amount, value.decimals, {
        fractionDigits: 4,
        min: 0.0001,
      })
    : undefined

  return (
    <div className="py-2.5 flex items-center gap-2.5">
      <AssetComboIcon icon={token.icon} name={token.name} />

      <div className="flex-1 flex flex-col items-start gap-0.5">
        <div className="text-sm font-bold">{token.name}</div>
        <div className="text-sm font-medium text-gray-11">{token.symbol}</div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className="text-sm font-medium" title={hideBalances ? undefined : formatted}>
          {hideBalances ? "••••" : (shortFormatted ?? "-")} {token.symbol}
        </div>
        {hideBalances ? (
          <span className="text-sm font-medium text-gray-11">••••</span>
        ) : usdValue != null ? (
          <FormattedCurrency
            value={usdValue}
            formatOptions={{ currency: "USD" }}
            className="text-sm font-medium text-gray-11"
          />
        ) : (
          "-"
        )}
      </div>
    </div>
  )
}

export function HoldingItemSkeleton() {
  return (
    <div className="py-2.5 flex items-center gap-2.5">
      <Skeleton className="size-7 rounded-full" />

      <div className="flex-1 flex flex-col items-start gap-0.5">
        <Skeleton className="text-sm">Ethereum</Skeleton>
        <Skeleton className="text-sm">ETH</Skeleton>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <Skeleton className="text-sm">0.9999 ETH</Skeleton>
        <Skeleton className="text-sm">$100.00</Skeleton>
      </div>
    </div>
  )
}
