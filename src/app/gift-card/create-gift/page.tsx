"use client"

import { GiftHistoryWidget, GiftMakerWidget } from "@defuse-protocol/defuse-sdk"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import React from "react"
import { useNearWalletActions } from "../../../hooks/useNearWalletActions"
import { createGiftCardLink } from "../_utils/link"

export default function CreateGiftPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()
  const { signAndSendTransactions } = useNearWalletActions()

  return (
    <Paper>
      <div className="flex flex-col items-center gap-8">
        <GiftMakerWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
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
          generateLink={(giftLinkData) => createGiftCardLink(giftLinkData)}
          initialToken={tokenIn}
          renderHostAppLink={renderAppLink}
        />
        <GiftHistoryWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          generateLink={(giftLinkData) => createGiftCardLink(giftLinkData)}
        />
      </div>
    </Paper>
  )
}
