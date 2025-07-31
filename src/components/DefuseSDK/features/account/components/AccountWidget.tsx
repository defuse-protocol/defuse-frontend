"use client"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { AuthMethod } from "../../../types/authHandle"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { authHandleToIntentsUserId } from "../../../utils/authIdentity"
import { useWatchHoldings } from "../hooks/useWatchHoldings"
import { computeTotalUsdValue } from "../utils/holdingsUtils"

import { HoldingsIsland } from "./HoldingsIsland"
import { SummaryIsland } from "./SummaryIsland"

export interface AccountWidgetProps {
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]

  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  renderHostAppLink: RenderHostAppLink
}

export function AccountWidget({
  tokenList,
  userAddress,
  userChainType,
  renderHostAppLink,
}: AccountWidgetProps) {
  const userId =
    userAddress != null && userChainType != null
      ? authHandleToIntentsUserId(userAddress, userChainType)
      : null

  const holdings = useWatchHoldings({ userId, tokenList })
  const totalValueUsd = holdings ? computeTotalUsdValue(holdings) : undefined

  const internalUserAddress =
    userAddress != null && userChainType != null
      ? authHandleToIntentsUserId(userAddress, userChainType)
      : null

  return (
    <WidgetRoot>
      <div className="widget-container flex flex-col gap-5">
        <SummaryIsland
          isLoggedIn={userAddress != null}
          valueUsd={totalValueUsd}
          renderHostAppLink={renderHostAppLink}
          internalUserAddress={internalUserAddress}
        />

        <HoldingsIsland isLoggedIn={userId != null} holdings={holdings} />
      </div>
    </WidgetRoot>
  )
}
