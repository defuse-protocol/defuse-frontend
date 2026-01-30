"use client"

import { OtcTakerWidget } from "@src/components/DefuseSDK/features/otcDesk/components/OtcTakerWidget"
import PageHeader from "@src/components/PageHeader"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useOtcOrder } from "../deals/_utils/link"

export default function DealPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { multiPayload, tradeId } = useOtcOrder()
  const { signAndSendTransactions } = useNearWallet()
  const referral = useIntentsReferral()

  return (
    <>
<PageHeader
        title="Execute a trustless trade"
        subtitle="A counterparty has offered you the following deal. Accept the offer to execute the swap trustlessly."
      />

      <OtcTakerWidget
        tradeId={tradeId}
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
        renderHostAppLink={renderAppLink}
      />
    </>
  )
}
