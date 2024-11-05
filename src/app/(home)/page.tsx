"use client"

import { SwapWidget } from "@defuse-protocol/defuse-sdk"

import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useWalletSelector } from "@src/providers/WalletSelectorProvider"

export default function Swap() {
  const { accountId } = useWalletSelector()
  const { signMessage, signAndSendTransactions } = useNearWalletActions()

  return (
    <Paper
      title="Swap"
      description="Cross-chain swap across any network, any token."
    >
      <SwapWidget
        tokenList={LIST_TOKENS}
        userAddress={accountId}
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
        signMessage={async (params) => {
          const { signatureData, signedData } = await signMessage({
            ...params.NEP413,
            nonce: Buffer.from(params.NEP413.nonce),
          })

          return { type: "NEP413", signatureData, signedData }
        }}
        onSuccessSwap={() => {}}
      />
    </Paper>
  )
}
