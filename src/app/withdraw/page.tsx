"use client"

import { WithdrawWidget } from "@defuse-protocol/defuse-sdk"
import { useSearchParams } from "next/navigation"

import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useLiquidityData } from "@src/hooks/useLiquidityData"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { renderAppLink } from "@src/utils/renderAppLink"
export default function Withdraw() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWalletActions()
  const tokenList = useTokenList(LIST_TOKENS)
  const referral = useIntentsReferral()
  const queryParams = useSearchParams()
  const amount = queryParams.get("amount") ?? undefined
  const tokenSymbol = queryParams.get("token") ?? undefined
  const network = queryParams.get("network") ?? undefined
  const recipient = queryParams.get("recipient") ?? undefined
  const liquidityData = useLiquidityData()

  return (
    <Paper>
      <WithdrawWidget
        presetAmount={amount}
        presetNetwork={network}
        presetRecipient={recipient}
        presetTokenSymbol={tokenSymbol}
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        chainType={state.chainType}
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
        signMessage={(params) => signMessage(params)}
        renderHostAppLink={renderAppLink}
        referral={referral}
        liquidityData={liquidityData}
      />
    </Paper>
  )
}
