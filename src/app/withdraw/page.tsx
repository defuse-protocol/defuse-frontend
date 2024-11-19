"use client"

import { useSignMessage } from "wagmi"

import { WithdrawWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useFlatTokenList } from "@src/hooks/useFlatTokenList"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"

export default function Withdraw() {
  const { state } = useConnectWallet()
  const { signMessage, signAndSendTransactions } = useNearWalletActions()
  const { signMessageAsync: signMessageAsyncWagmi } = useSignMessage()
  const tokenList = useFlatTokenList(LIST_TOKENS)

  return (
    <Paper title="Withdraw">
      <WithdrawWidget
        tokenList={tokenList}
        userAddress={state.address}
        // @ts-expect-error
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
        signMessage={async (params) => {
          const chainType = state.chainType

          switch (chainType) {
            case ChainType.EVM: {
              const signatureData = await signMessageAsyncWagmi({
                message: params.ERC191.message,
              })
              return {
                type: "ERC191",
                signatureData,
                signedData: params.ERC191,
              }
            }
            case ChainType.Near: {
              const { signatureData, signedData } = await signMessage({
                ...params.NEP413,
                nonce: Buffer.from(params.NEP413.nonce),
              })
              return { type: "NEP413", signatureData, signedData }
            }
            case undefined:
              throw new Error("User not signed in")
            case ChainType.Solana:
              throw new Error("Solana not supported")
            default:
              chainType satisfies never
              throw new Error(`Unsupported sign in type: ${chainType}`)
          }
        }}
      />
    </Paper>
  )
}
