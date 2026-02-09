"use client"

import { GiftTakerWidget } from "@src/components/DefuseSDK/features/gift/components/GiftTakerWidget"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useMemo } from "react"
import { useGiftIntent } from "../_utils/link"
import { PublicShell } from "./PublicShell"

export default function ViewGiftPage() {
  const { state, isLoading, isReconnecting } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const { payload, giftId, error } = useGiftIntent()

  const loginUrl = useMemo(() => {
    if (typeof window === "undefined") return "/login"
    const hash = window.location.hash
    return `/login?redirect=${encodeURIComponent(`/gifts/view${hash}`)}`
  }, [])

  // Cover everything while loading to prevent nav flash
  if (isLoading || isReconnecting) {
    return <div className="fixed inset-0 z-50 bg-gray-800" />
  }

  if (state.address) {
    return (
      <Paper>
        <GiftTakerWidget
          giftId={giftId}
          payload={payload}
          tokenList={tokenList}
          userAddress={state.address}
          userChainType={state.chainType}
          externalError={error}
        />
      </Paper>
    )
  }

  return (
    <PublicShell loginUrl={loginUrl}>
      <GiftTakerWidget
        giftId={giftId}
        payload={payload}
        tokenList={tokenList}
        userAddress={undefined}
        userChainType={undefined}
        externalError={error}
      />
    </PublicShell>
  )
}
