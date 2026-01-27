"use client"

import { OtcTakerWidget } from "@src/components/DefuseSDK/features/otcDesk/components/OtcTakerWidget"
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
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        Accept a deal offer
      </h1>
      <p className="mt-1 text-gray-500 text-base/5 font-medium">
        Pay the specified amount to finalize the transaction.
      </p>

      <OtcTakerWidget
        tradeId={tradeId}
        multiPayload={multiPayload}
        tokenList={tokenList}
        userAddress={state.isAuthorized ? state.address : undefined}
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
