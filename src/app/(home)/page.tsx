"use client"

import { SwapWidget } from "@defuse-protocol/defuse-sdk"
import { useWallet as useWalletSolana } from "@solana/wallet-adapter-react"
import { useRouter } from "next/navigation"
import { useSignMessage } from "wagmi"

import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useFlatTokenList } from "@src/hooks/useFlatTokenList"
import { useNearWalletActions } from "@src/hooks/useNearWalletActions"

export default function Swap() {
  const { state } = useConnectWallet()
  const { signMessage, signAndSendTransactions } = useNearWalletActions()
  const { signMessageAsync: signMessageAsyncWagmi } = useSignMessage()
  const solanaWallet = useWalletSolana()
  const tokenList = useFlatTokenList(LIST_TOKENS)
  const router = useRouter()

  return (
    <Paper
      title="Swap"
      description="Cross-chain swap across any network, any token."
    >
      <SwapWidget
        tokenList={tokenList}
        userAddress={state.address ?? null}
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

            case ChainType.Solana: {
              if (solanaWallet.signMessage == null) {
                throw new Error("Solana wallet does not support signMessage")
              }

              const signatureData = await solanaWallet.signMessage(
                params.SOLANA.message
              )

              return {
                type: "SOLANA",
                signatureData,
                signedData: params.SOLANA,
              }
            }

            case undefined:
              throw new Error("User not signed in")

            default:
              chainType satisfies never
              throw new Error(`Unsupported sign in type: ${chainType}`)
          }
        }}
        onSuccessSwap={() => {}}
        onNavigateDeposit={() => {
          router.push("/deposit")
        }}
        userChainType={state.chainType ?? null}
      />
    </Paper>
  )
}
