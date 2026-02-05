"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { HistoryWidget } from "@src/components/DefuseSDK/features/history/components"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useEffect, useState } from "react"

export default function HistoryPage() {
  const {
    state,
    isLoading: isWalletConnecting,
    isReconnecting: isWalletReconnecting,
  } = useConnectWallet()

  const tokenList = useTokenList(LIST_TOKENS)
  // Prevents "Connect wallet" flash while wallets like NEAR reconnect async
  const [hadPreviousSession, setHadPreviousSession] = useState(true)
  useEffect(() => {
    // Sync with localStorage when disconnected (on mount or after logout)
    if (state.address == null) {
      setHadPreviousSession(localStorage.getItem("chainType") !== null)
    }
  }, [state.address])
  const { address: walletAddress, chainType } = state
  const userAddress =
    state.isAuthorized && walletAddress != null && chainType != null
      ? authIdentity.authHandleToIntentsUserId(walletAddress, chainType)
      : null
  const isWaitingForReconnect = hadPreviousSession && !state.address
  const isWalletLoading =
    isWalletConnecting ||
    isWalletReconnecting ||
    isWaitingForReconnect ||
    Boolean(state.address && !state.isAuthorized)

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
