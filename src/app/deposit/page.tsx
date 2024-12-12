"use client"

import React from "react"

import { DepositWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"

export default function Deposit() {
  const { state, sendTransaction } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)

  return (
    <Paper title="Deposit">
      <DepositWidget
        tokenList={tokenList}
        userAddress={state.address}
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
      />
    </Paper>
  )
}
