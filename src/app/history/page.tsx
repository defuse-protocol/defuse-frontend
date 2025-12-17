"use client"

import { HistoryWidget } from "@src/components/DefuseSDK/features/history/components"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"

export default function HistoryPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)

  return (
    <Paper>
      <HistoryWidget
        userAddress={(state.isVerified ? state.address : undefined) ?? null}
        tokenList={tokenList}
      />
    </Paper>
  )
}
