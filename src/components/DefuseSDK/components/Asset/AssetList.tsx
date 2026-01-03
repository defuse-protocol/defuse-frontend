import { hasChainIcon } from "@src/app/(app)/(dashboard)/swap/_utils/useDeterminePair"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import ListItem from "@src/components/ListItem"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import clsx from "clsx"
import { useCallback } from "react"
import { FormattedCurrency } from "../../features/account/components/shared/FormattedCurrency"
import type { TokenInfo } from "../../types/base"
import { formatTokenValue } from "../../utils/format"
import { getTokenId, isBaseToken } from "../../utils/token"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"
import AssetComboIcon from "./AssetComboIcon"

type Props<T> = {
  assets: SelectItemToken<T>[]
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

  const hasAssetsWithBalance = assetsWithBalance.length > 0

  return (
    <div
      className={clsx("flex flex-col space-y-8", className)}
      data-testid="asset-list"
    >
      {assetsWithBalance.length > 0 && (
        <div>
          <h3 className="text-gray-500 text-sm font-medium">Your tokens</h3>

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
          <h3 className="text-gray-500 text-sm font-medium">
            {hasAssetsWithBalance ? "More tokens" : "All tokens"}
          </h3>

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
  <ListItem onClick={onClick} highlight={selected}>
    <AssetComboIcon
      icon={token.icon}
      name={token.name}
      showChainIcon={showChainIcon}
      chainName={isBaseToken(token) ? token.originChainName : undefined}
      chainIcon={chainIcon}
    />

    <ListItem.Content>
      <ListItem.Title>{token.name}</ListItem.Title>
      <ListItem.Subtitle>{token.symbol}</ListItem.Subtitle>
    </ListItem.Content>

    <ListItem.Content align="end">
      {usdValue != null && (
        <ListItem.Title>
          <FormattedCurrency
            value={usdValue ?? 0}
            formatOptions={{ currency: "USD" }}
            className="text-base/none font-semibold text-gray-900 text-right"
          />
        </ListItem.Title>
      )}
      {isHoldingsEnabled && value && (
        <ListItem.Subtitle>
          {formatTokenValue(value.amount, value.decimals, {
            fractionDigits: 4,
            min: 0.0001,
          })}
        </ListItem.Subtitle>
      )}
    </ListItem.Content>
  </ListItem>
)
