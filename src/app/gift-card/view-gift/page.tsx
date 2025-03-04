"use client"

import { GiftTakerWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import React from "react"
import { safeTokenList } from "../../otc-desk/_utils/safeTokenList"
import { useGiftCard } from "../_utils/link"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(safeTokenList)
  const signMessage = useWalletAgnosticSignMessage()
  const multiPayload = useGiftCard()
  const { signAndSendTransactions } = useNearWalletActions()
  const referral = useIntentsReferral()

  return (
    <Paper>
      <GiftTakerWidget
        multiPayload={multiPayload}
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
      />
    </Paper>
  )
}
