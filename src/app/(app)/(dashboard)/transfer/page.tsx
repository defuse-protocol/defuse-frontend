"use client"

import { WithdrawWidget } from "@src/components/DefuseSDK/features/withdraw/components/WithdrawWidget"
import PageHeader from "@src/components/PageHeader"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useNearWallet } from "@src/providers/NearWalletProvider"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useSearchParams } from "next/navigation"

export default function TransferPage() {
  const { state } = useConnectWallet()
  const signMessage = useWalletAgnosticSignMessage()
  const { signAndSendTransactions } = useNearWallet()
  const tokenList = useTokenList(LIST_TOKENS, true)
  const referral = useIntentsReferral()
  const queryParams = useSearchParams()
  const amount = queryParams.get("amount") ?? undefined
  const tokenSymbol = queryParams.get("token") ?? undefined
  const network = queryParams.get("network") ?? undefined
  const recipient = queryParams.get("recipient") ?? undefined

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType

  return (
    <>
      <PageHeader
        title="Transfer"
        subtitle="Your assets, anywhere you need them"
      />

      <WithdrawWidget
        presetAmount={amount}
        presetNetwork={network}
        presetRecipient={recipient}
        presetTokenSymbol={tokenSymbol}
        tokenList={tokenList}
        userAddress={userAddress}
        displayAddress={state.isVerified ? state.displayAddress : undefined}
        chainType={userChainType}
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
      />
    </>
  )
}
