"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { TokenListUpdater } from "@src/components/DefuseSDK/components/TokenListUpdater"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { GiftsHeader } from "@src/components/DefuseSDK/features/gift/components/GiftsHeader"
import { GiftHistory } from "@src/components/DefuseSDK/features/gift/components/shared/GiftHistory"
import { useGiftMakerHistory } from "@src/components/DefuseSDK/features/gift/stores/giftMakerHistory"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useMemo } from "react"
import { createGiftLink } from "./_utils/link"

export default function GiftCardPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  const signerCredentials: SignerCredentials | null = useMemo(() => {
    return userAddress && userChainType
      ? {
          credential: userAddress,
          credentialType: userChainType,
        }
      : null
  }, [userChainType, userAddress])

  const gifts = useGiftMakerHistory((s) => {
    if (!signerCredentials) {
      return undefined
    }
    const userId = authIdentity.authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    )
    return s.gifts[userId]
  })

  return (
    <>
      <SwapWidgetProvider>
        <TokenListUpdater tokenList={tokenList} />

        <GiftsHeader />

        <GiftHistory
          signerCredentials={signerCredentials}
          tokenList={tokenList}
          generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
          gifts={gifts}
        />
      </SwapWidgetProvider>
    </>
  )
}
