"use client"

import { AccountWidget } from "@src/components/DefuseSDK/features/account/components/AccountWidget"
import { QueryClientProvider } from "@src/components/DefuseSDK/providers/QueryClientProvider"

import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"

export default function AccountPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)

  return (
    <Paper>
      <QueryClientProvider>
        <AccountWidget
          tokenList={tokenList}
          userAddress={(state.isVerified ? state.address : undefined) ?? null}
          userChainType={state.chainType ?? null}
          renderHostAppLink={renderAppLink}
        />
      </QueryClientProvider>
    </Paper>
  )
}
