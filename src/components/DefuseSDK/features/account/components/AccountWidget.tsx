"use client"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { useMemo } from "react"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { HideBalancesConfig } from "../../../hooks/useHideBalances"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { useWatchHoldings } from "../hooks/useWatchHoldings"
import { computeTotalUsdValue } from "../utils/holdingsUtils"
import { HoldingsIsland } from "./HoldingsIsland"
import { PrivateHoldingsIsland } from "./PrivateHoldingsIsland"
import { SummaryIsland } from "./SummaryIsland"

export interface AccountWidgetProps {
  tokenList: TokenInfo[]

  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  renderHostAppLink: RenderHostAppLink

  hideBalances?: HideBalancesConfig
}

export function AccountWidget({
  tokenList,
  userAddress,
  userChainType,
  renderHostAppLink,
  hideBalances,
}: AccountWidgetProps) {
  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

  // This case for `flatTokenList=1`, where we combine all tokens into one list.
  // So there might be tokens with the same `defuseAssetId`, so we need to remove them.
  // Otherwise, we'll end up showing the same token multiple times.
  tokenList = useMemo(() => {
    const map = new Map()
    for (const t of tokenList) {
      if (!map.has(getTokenId(t))) {
        map.set(getTokenId(t), t)
      }
    }
    return Array.from(map.values())
  }, [tokenList])

  const holdings = useWatchHoldings({ userId, tokenList })
  const totalValueUsd = holdings ? computeTotalUsdValue(holdings) : undefined

  const internalUserAddress =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

  return (
    <WidgetRoot>
      <div className="widget-container flex flex-col gap-5">
        <SummaryIsland
          isLoggedIn={userAddress != null}
          valueUsd={totalValueUsd}
          renderHostAppLink={renderHostAppLink}
          internalUserAddress={internalUserAddress}
          hideBalances={hideBalances?.hidden}
          onToggleHideBalances={hideBalances?.toggle}
        />

        <HoldingsIsland
          isLoggedIn={userId != null}
          holdings={holdings}
          hideBalances={hideBalances?.hidden}
        />

        <PrivateHoldingsIsland
          tokenList={tokenList}
          isLoggedIn={userAddress != null}
        />
      </div>
    </WidgetRoot>
  )
}
