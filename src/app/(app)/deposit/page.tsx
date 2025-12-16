"use client"

import { DepositWidget } from "@src/components/DefuseSDK/features/deposit/components/DepositWidget"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"
import { useRouter, useSearchParams } from "next/navigation"
import {
  updateURLParamsDeposit,
  useDeterminePair,
} from "../swap/_utils/useDeterminePair"

export default function Deposit() {
  const { state, sendTransaction } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const { tokenIn } = useDeterminePair()
  const router = useRouter()
  const searchParams = useSearchParams()

  return (
    <Paper>
      <DepositWidget
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        userWalletAddress={
          state.isVerified &&
          state.chainType !== ChainType.WebAuthn &&
          state.displayAddress
            ? state.displayAddress
            : null
        }
        chainType={state.chainType}
        sendTransactionNear={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Near,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionEVM={async ({ from, ...tx }) => {
          const result = await sendTransaction({
            id: ChainType.EVM,
            tx: {
              ...tx,
              account: from,
            },
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionSolana={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Solana,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionTon={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Ton,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionStellar={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Stellar,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        sendTransactionTron={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Tron,
            tx,
          })
          return Array.isArray(result) ? result[0].transaction.hash : result
        }}
        renderHostAppLink={renderAppLink}
        initialToken={tokenIn ?? undefined}
        onTokenChange={(params) =>
          updateURLParamsDeposit({
            router,
            searchParams,
            tokenIn: params.token,
            tokenOut: null,
          })
        }
      />
    </Paper>
  )
}
