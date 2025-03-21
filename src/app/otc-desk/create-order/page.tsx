"use client"

import { OtcMakerWidget } from "@defuse-protocol/defuse-sdk"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import { createOTCOrderLink } from "../_utils/link"
import { safeTokenList } from "../_utils/safeTokenList"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(safeTokenList)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn, tokenOut } = useDeterminePair()
  const { signAndSendTransactions } = useNearWalletActions()
  const referral = useIntentsReferral()

  return (
    <Paper>
      <OtcMakerWidget
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
        generateLink={(multiPayload) => {
          console.log("multiPayload", multiPayload)
          return createOTCOrderLink(multiPayload)
        }}
        initialTokenIn={tokenIn}
        initialTokenOut={tokenOut}
        renderHostAppLink={renderAppLink}
        referral={referral}
      />
    </Paper>
  )
}
