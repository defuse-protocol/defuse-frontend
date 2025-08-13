"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import { OtcMakerWidget } from "@src/components/DefuseSDK"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
import { createOtcOrder, createOtcOrderLink } from "../_utils/link"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn, tokenOut } = useDeterminePair()
  const { signAndSendTransactions } = useNearWalletActions()
  const referral = useIntentsReferral()

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null
  const holdings = useWatchHoldings({ userId, tokenList })

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
        initialTokenIn={tokenIn}
        initialTokenOut={tokenOut}
        renderHostAppLink={renderAppLink}
        referral={referral}
        holdings={holdings}
      />
    </Paper>
  )
}
