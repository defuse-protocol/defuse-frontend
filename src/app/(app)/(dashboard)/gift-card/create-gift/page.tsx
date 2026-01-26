"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { TokenListUpdater } from "@src/components/DefuseSDK/components/TokenListUpdater"
import { WidgetRoot } from "@src/components/DefuseSDK/components/WidgetRoot"
import type { SignerCredentials } from "@src/components/DefuseSDK/core/formatters"
import { GiftsHeader } from "@src/components/DefuseSDK/features/gift/components/GiftsHeader"
import { ModalCreateGift } from "@src/components/DefuseSDK/features/gift/components/ModalCreateGift"
import { GiftHistory } from "@src/components/DefuseSDK/features/gift/components/shared/GiftHistory"
import { useGiftMakerHistory } from "@src/components/DefuseSDK/features/gift/stores/giftMakerHistory"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useMemo, useState } from "react"
import { useDeterminePair } from "../../swap/_utils/useDeterminePair"
import { createGiftIntent, createGiftLink } from "../_utils/link"

export default function CreateGiftPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()
  const { signAndSendTransactions } = useNearWallet()

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

  const sendNearTransaction = async (
    tx: Parameters<typeof signAndSendTransactions>[0]["transactions"][0]
  ) => {
    const result = await signAndSendTransactions({ transactions: [tx] })

    if (typeof result === "string") {
      return { txHash: result }
    }

    const outcome = result[0]
    if (!outcome) {
      throw new Error("No outcome")
    }

    return { txHash: outcome.transaction.hash }
  }

  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <TokenListUpdater tokenList={tokenList} />

        <GiftsHeader onCreateClick={() => setIsModalOpen(true)} />

        <GiftHistory
          signerCredentials={signerCredentials}
          tokenList={tokenList}
          generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
          gifts={gifts}
        />

        <ModalCreateGift
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          tokenList={tokenList}
          userAddress={userAddress}
          chainType={userChainType}
          signMessage={signMessage}
          sendNearTransaction={sendNearTransaction}
          referral={referral}
          createGiftIntent={async (payload, options) =>
            createGiftIntent(payload, options)
          }
          generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
          initialToken={tokenIn ?? undefined}
          renderHostAppLink={renderAppLink}
        />
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}
