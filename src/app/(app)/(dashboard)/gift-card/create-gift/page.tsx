"use client"
import { GiftHistoryWidget } from "@src/components/DefuseSDK/features/gift/components/GiftHistoryWidget"
import { GiftMakerWidget } from "@src/components/DefuseSDK/features/gift/components/GiftMakerWidget"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useDeterminePair } from "../../swap/_utils/useDeterminePair"
import { createGiftIntent, createGiftLink } from "../_utils/link"

export default function CreateGiftPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()
  const { signAndSendTransactions } = useNearWallet()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  return (
    <Paper>
      <div className="flex w-full flex-col items-center gap-8">
        <GiftMakerWidget
          tokenList={tokenList}
          userAddress={userAddress}
          chainType={userChainType}
          signMessage={signMessage}
          sendNearTransaction={async (tx) => {
            const result = await signAndSendTransactions({ transactions: [tx] })

            if (typeof result === "string") {
              return { txHash: result }
            }

            const outcome = result[0]
            if (!outcome) {
              throw new Error("No outcome")
            }

            return { txHash: outcome.transaction.hash }
          }}
          referral={referral}
          createGiftIntent={async (payload) => createGiftIntent(payload)}
          generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
          initialToken={tokenIn ?? undefined}
          renderHostAppLink={renderAppLink}
        />
        <GiftHistoryWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          generateLink={(giftLinkData) => createGiftLink(giftLinkData)}
        />
      </div>
    </Paper>
  )
}
