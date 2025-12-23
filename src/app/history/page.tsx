"use client"

import { HistoryWidget } from "@src/components/DefuseSDK/features/history/components"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import { useEffect, useState } from "react"

export default function HistoryPage() {
  const { state, isLoading: isWalletConnecting } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const hasHydrated = useVerifiedWalletsStore((s) => s._hasHydrated)
  // Prevents "Connect wallet" flash while wallets like NEAR reconnect async
  const [hadPreviousSession, setHadPreviousSession] = useState(true)
  useEffect(() => {
    setHadPreviousSession(localStorage.getItem("chainType") !== null)
  }, [])

  const userAddress = state.isVerified ? (state.address ?? null) : null
  const isWaitingForReconnect = hadPreviousSession && !state.address
  const isWalletLoading =
    !hasHydrated ||
    isWalletConnecting ||
    isWaitingForReconnect ||
    Boolean(state.address && !state.isVerified)

  return (
    <Paper>
      <HistoryWidget
        userAddress={userAddress}
        tokenList={tokenList}
        isWalletLoading={isWalletLoading}
      />
    </Paper>
  )
}
