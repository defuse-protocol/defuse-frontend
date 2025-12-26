import clsx from "clsx"
import { type ReactNode, useCallback } from "react"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"

import { hasChainIcon } from "@src/app/(app)/swap/_utils/useDeterminePair"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { FormattedCurrency } from "../../features/account/components/shared/FormattedCurrency"
import type { TokenInfo } from "../../types/base"
import { formatTokenValue } from "../../utils/format"
import { getTokenId, isBaseToken } from "../../utils/token"
import AssetComboIcon from "./AssetComboIcon"

type Props<T> = {
  assets: SelectItemToken<T>[]
  emptyState?: ReactNode
  className?: string
  accountId?: string
  handleSelectToken?: (token: SelectItemToken<T>) => void
  showChain?: boolean
}

function AssetList<T extends TokenInfo>({
  assets,
  className,
  handleSelectToken,
  showChain = false,
}: Props<T>) {
  const tokens = useTokensStore((state) => state.tokens)
  const isFlatTokenListEnabled = useIsFlatTokenListEnabled()

  const showChainIcon = useCallback(
    (
      token: TokenInfo,
      chainIcon: { dark: string; light: string } | undefined
    ) =>
      (isFlatTokenListEnabled && chainIcon !== undefined) ||
      (showChain && chainIcon !== undefined && hasChainIcon(token, tokens)),
    [tokens, showChain, isFlatTokenListEnabled]
  )

  const [assetsWithBalance, assetsWithoutBalance] = assets.reduce<
    [SelectItemToken<T>[], SelectItemToken<T>[]]
  >(
    (acc, asset) => {
      acc[asset.value?.amount && asset.value.amount > 0n ? 0 : 1].push(asset)
      return acc
    },
    [[], []]
  )

  return (
    <div
      className={clsx("flex flex-col space-y-8", className && className)}
      data-testid="asset-list"
    >
      {assetsWithBalance.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-sm">Your tokens</h3>

          <div className="mt-2 flex flex-col gap-1">
            {assetsWithBalance.map((asset, index) => {
              const chainIcon = isBaseToken(asset.token)
                ? chainIcons[asset.token.originChainName]
                : undefined

              return (
                <AssetItem
                  key={getTokenId(asset.token)}
                  {...asset}
                  chainIcon={chainIcon}
                  showChainIcon={showChainIcon(asset.token, chainIcon)}
                  // biome-ignore lint/style/noNonNullAssertion: i is always within bounds
                  onClick={() => handleSelectToken?.(assetsWithBalance[index]!)}
                />
              )
            })}
          </div>
        </div>
      )}

      {assetsWithoutBalance.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-sm">More tokens</h3>

          <div className="mt-2 flex flex-col gap-1">
            {assetsWithoutBalance.map((asset, index) => {
              const chainIcon = isBaseToken(asset.token)
                ? chainIcons[asset.token.originChainName]
                : undefined

              return (
                <AssetItem
                  key={getTokenId(asset.token)}
                  {...asset}
                  chainIcon={chainIcon}
                  showChainIcon={showChainIcon(asset.token, chainIcon)}
                  onClick={() =>
                    // biome-ignore lint/style/noNonNullAssertion: i is always within bounds
                    handleSelectToken?.(assetsWithoutBalance[index]!)
                  }
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default AssetList

const AssetItem = ({
  token,
  value,
  isHoldingsEnabled,
  usdValue,
  selected,
  showChainIcon,
  chainIcon,
  onClick,
}: SelectItemToken & {
  showChainIcon: boolean
  chainIcon: { dark: string; light: string } | undefined
  onClick: () => void
}) => (
  <button
    type="button"
    onClick={onClick}
    className={clsx(
      "relative py-2.5 text-left flex items-center gap-3 -mx-4 px-4 rounded-2xl overflow-hidden hover:bg-gray-100",
      {
        "bg-gray-100": selected,
      }
    )}
  >
    <AssetComboIcon
      icon={token.icon}
      name={token.name}
      showChainIcon={showChainIcon}
      chainName={isBaseToken(token) ? token.originChainName : undefined}
      chainIcon={chainIcon}
    />

    <div className="grow flex flex-col gap-1">
      <div className="text-base font-medium text-gray-900 leading-none">
        {token.name}
      </div>
      <div className="text-sm leading-none text-gray-500">{token.symbol}</div>
    </div>

    <div className="flex flex-col gap-1">
      {usdValue != null ? (
        <>
          <FormattedCurrency
            value={usdValue}
            formatOptions={{ currency: "USD" }}
            className="text-base font-medium text-gray-900 text-right leading-none"
          />
        </>
      ) : null}
      <div className="text-sm leading-none text-gray-500 text-right">
        {isHoldingsEnabled && value
          ? formatTokenValue(value.amount, value.decimals, {
              fractionDigits: 4,
              min: 0.0001,
            })
          : null}
      </div>
    </div>
  </button>
)
