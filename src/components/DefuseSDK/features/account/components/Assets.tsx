import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import type { Holding } from "../types/sharedTypes"
import { FormattedCurrency } from "./shared/FormattedCurrency"

const Assets = ({ assets }: { assets: Holding[] | undefined }) => {
  if (!assets) return <div>No assets</div>

  return (
    <section className="mt-9">
      <h2 className="text-base text-gray-500">Assets</h2>
      <div className="mt-2">
        {assets.map((asset) => (
          <Asset key={getTokenId(asset.token)} asset={asset} />
        ))}
      </div>
    </section>
  )
}

const Asset = ({ asset }: { asset: Holding }) => {
  const { token, value, usdValue } = asset

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
    <div className="flex gap-3 items-center py-3">
      <AssetComboIcon icon={token.icon} name={token.name} showChainIcon />

      <div className="flex-1 flex flex-col items-start gap-1">
        <div className="text-base font-medium text-gray-900 leading-none">
          {token.name}
        </div>
        <div className="text-sm leading-none text-gray-500">{token.symbol}</div>
      </div>

      <div className="flex flex-col items-end gap-1">
        {usdValue === null ? (
          "-"
        ) : (
          <FormattedCurrency
            value={usdValue ?? 0}
            formatOptions={{ currency: "USD" }}
            className="text-base font-medium text-gray-900 leading-none"
          />
        )}
        <div
          className="text-sm leading-none text-gray-500 text-right"
          title={formatted}
        >
          {shortFormatted ?? "-"} {token.symbol}
        </div>
      </div>
    </div>
  )
}

export default Assets
