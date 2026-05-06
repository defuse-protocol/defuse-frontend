"use client"

import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { AccountWidget } from "@src/components/DefuseSDK/features/account/components/AccountWidget"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import { useHideBalances } from "@src/components/DefuseSDK/hooks/useHideBalances"
import { QueryClientProvider } from "@src/components/DefuseSDK/providers/QueryClientProvider"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"

import { LegacyBtcNotice } from "@src/components/LegacyBtcNotice"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"

export default function AccountPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const hideBalances = useHideBalances()

  const userAddress = (state.isVerified ? state.address : undefined) ?? null
  const userChainType = state.chainType ?? null

  return (
    <Paper>
      <QueryClientProvider>
        <AccountPageBody
          tokenList={tokenList}
          userAddress={userAddress}
          userChainType={userChainType}
          hideBalances={hideBalances}
        />
      </QueryClientProvider>
    </Paper>
  )
}

function AccountPageBody({
  tokenList,
  userAddress,
  userChainType,
  hideBalances,
}: {
  tokenList: TokenInfo[]
  userAddress: string | null
  userChainType: AuthMethod | null
  hideBalances: ReturnType<typeof useHideBalances>
}) {
  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null
  const holdings = useWatchHoldings({ userId, tokenList })

  return (
    <>
      <LegacyBtcNotice holdings={holdings} isHidden={userId == null} />
      <AccountWidget
        tokenList={tokenList}
        userAddress={userAddress}
        userChainType={userChainType}
        renderHostAppLink={renderAppLink}
        hideBalances={hideBalances}
      />
    </>
  )
}
