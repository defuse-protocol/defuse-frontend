"use client"

import { AccountWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useSignInWindowOpenState } from "@src/stores/useSignInWindowOpenState"

export default function AccountPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const { open } = useSignInWindowOpenState()

  return (
    <Paper>
      <AccountWidget
        tokenList={tokenList}
        userAddress={(state.isVerified ? state.address : undefined) ?? null}
        userChainType={state.chainType ?? null}
        depositHref="/deposit"
        withdrawHref="/withdraw"
        giftHref=""
        onSignInRequest={() => {
          open()
        }}
      />
    </Paper>
  )
}
