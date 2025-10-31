import { CheckCircleIcon } from "@phosphor-icons/react"
import { Text } from "@radix-ui/themes"
import clsx from "clsx"
import { type ReactNode, useCallback } from "react"

import type { TokenValue } from "../../types/base"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"

import { hasChainIcon } from "@src/app/(home)/_utils/useDeterminePair"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import { useTokensStore } from "@src/components/DefuseSDK/providers/TokensStoreProvider"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { FormattedCurrency } from "../../features/account/components/shared/FormattedCurrency"
import type { TokenInfo } from "../../types/base"
import { formatTokenValue } from "../../utils/format"
import { getTokenId, isBaseToken } from "../../utils/token"
import { AssetComboIcon } from "./AssetComboIcon"

type Props<T> = {
  assets: SelectItemToken<T>[]
  emptyState?: ReactNode
  className?: string
  accountId?: string
  handleSelectToken?: (token: SelectItemToken<T>) => void
  showChain?: boolean
}

export function AssetList<T extends TokenInfo>({
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
    ) => {
      return (
        (isFlatTokenListEnabled && chainIcon !== undefined) ||
        (showChain && chainIcon !== undefined && hasChainIcon(token, tokens))
      )
    },
    [tokens, showChain, isFlatTokenListEnabled]
  )

  return (
    <div
      className={clsx("flex flex-col", className && className)}
      data-testid="asset-list"
    >
      {assets.map(
        ({ token, selected, isHoldingsEnabled, value, usdValue }, i) => {
          const chainIcon = isBaseToken(token)
            ? chainIcons[token.originChainName]
            : undefined

          return (
            <button
              key={getTokenId(token)}
              type="button"
              className={clsx(
                "flex justify-between items-center gap-3 p-2.5 rounded-md hover:bg-gray-3",
                { "bg-gray-3": selected }
              )}
              // biome-ignore lint/style/noNonNullAssertion: i is always within bounds
              onClick={() => handleSelectToken?.(assets[i]!)}
            >
              <div className="relative">
                <AssetComboIcon
                  icon={token.icon}
                  name={token.name}
                  showChainIcon={showChainIcon(token, chainIcon)}
                  chainName={
                    isBaseToken(token) ? token.originChainName : undefined
                  }
                  chainIcon={chainIcon}
                />
                {selected && (
                  <div className="absolute -top-[7px] -left-[4px] rounded-full">
                    <CheckCircleIcon width={16} height={16} weight="fill" />
                  </div>
                )}
              </div>
              <div className="grow flex flex-col">
                <div className="flex justify-between items-center">
                  <Text as="span" size="2" weight="medium">
                    {token.name}
                  </Text>
                  {isHoldingsEnabled && renderBalance({ value })}
                </div>
                <div className="flex justify-between items-center text-gray-11">
                  <Text as="span" size="2">
                    {token.symbol}
                  </Text>
                  {usdValue != null ? (
                    <FormattedCurrency
                      value={usdValue}
                      formatOptions={{ currency: "USD" }}
                      className="text-sm font-medium text-gray-11"
                    />
                  ) : (
                    ""
                  )}
                </div>
              </div>
            </button>
          )
        }
      )}
    </div>
  )
}

function renderBalance({ value }: { value: TokenValue | undefined }) {
  const shortFormatted = value
    ? formatTokenValue(value.amount, value.decimals, {
        fractionDigits: 4,
        min: 0.0001,
      })
    : undefined

  return (
    <Text as="span" size="2" weight="medium">
      {shortFormatted ?? "0"}
    </Text>
  )
}
