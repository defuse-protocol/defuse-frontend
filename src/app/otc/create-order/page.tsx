"use client"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { OtcMakerWidget } from "@src/components/DefuseSDK/features/otcDesk/components/OtcMakerWidget"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { createOtcOrder, createOtcOrderLink } from "../_utils/link"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn, tokenOut } = useDeterminePair()
  const { signAndSendTransactions } = useNearWallet()
  const referral = useIntentsReferral()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  return (
    <Paper>
      <OtcMakerWidget
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
        createOtcTrade={async (multiPayload) => {
          return createOtcOrder(multiPayload)
        }}
        generateLink={(tradeId, pKey, multiPayload, iv) => {
          return createOtcOrderLink(tradeId, pKey, multiPayload, iv)
        }}
        initialTokenIn={tokenIn ?? undefined}
        initialTokenOut={tokenOut ?? undefined}
        renderHostAppLink={renderAppLink}
        referral={referral}
      />
    </Paper>
  )
}
