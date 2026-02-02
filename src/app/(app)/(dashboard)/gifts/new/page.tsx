"use client"

import { TokenListUpdater } from "@src/components/DefuseSDK/components/TokenListUpdater"
import { WidgetRoot } from "@src/components/DefuseSDK/components/WidgetRoot"
import { GiftMakerForm } from "@src/components/DefuseSDK/features/gift/components/GiftMakerForm"
import { GiftsHeader } from "@src/components/DefuseSDK/features/gift/components/GiftsHeader"
import { SwapWidgetProvider } from "@src/components/DefuseSDK/providers/SwapWidgetProvider"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useRouter } from "next/navigation"
import { useDeterminePair } from "../../swap/_utils/useDeterminePair"
import { createGiftIntent, createGiftLink } from "../_utils/link"

export default function NewGiftPage() {
  const router = useRouter()
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()
  const { signAndSendTransactions } = useNearWallet()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

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

        <GiftsHeader />

        <section className="mt-5">
          <GiftMakerForm
            tokenList={tokenList}
            userAddress={userAddress}
            chainType={userChainType}
            signMessage={signMessage}
            sendNearTransaction={sendNearTransaction}
            referral={referral}
            createGiftIntent={createGiftIntent}
            generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
            initialToken={tokenIn ?? undefined}
            renderHostAppLink={renderAppLink}
            onSuccess={() => router.push("/gifts")}
          />
        </section>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}
