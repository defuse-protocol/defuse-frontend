import { ShieldIcon } from "@phosphor-icons/react"
import { AssetComboIcon } from "../../../../components/Asset/AssetComboIcon"
import { formatTokenValue } from "../../../../utils/format"
import type { Holding } from "../../types/sharedTypes"
import { FormattedCurrency } from "./FormattedCurrency"

interface PrivateHoldingItemProps {
  holding: Holding
}

export function PrivateHoldingItem({ holding }: PrivateHoldingItemProps) {
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
      <div className="relative">
        <AssetComboIcon icon={token.icon} name={token.name} />
        <div className="absolute -bottom-0.5 -right-0.5 bg-gray-1 rounded-full p-0.5">
          <ShieldIcon className="w-3 h-3 text-primary" weight="fill" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-start gap-0.5">
        <div className="text-sm font-bold">{token.name}</div>
        <div className="text-sm font-medium text-gray-11">{token.symbol}</div>
      </div>

      <div className="flex flex-col items-end gap-0.5">
        <div className="text-sm font-medium" title={formatted}>
          {shortFormatted ?? "-"} {token.symbol}
        </div>
        {usdValue != null ? (
          <FormattedCurrency
            value={usdValue}
            formatOptions={{ currency: "USD" }}
            className="text-sm font-medium text-gray-11"
          />
        ) : (
          <span className="text-sm font-medium text-gray-11">-</span>
        )}
      </div>
    </div>
  )
}
