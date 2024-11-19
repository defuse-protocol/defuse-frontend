"use client"

import React from "react"

import { DepositWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { ChainType, useConnectWallet } from "@src/hooks/useConnectWallet"

export default function Deposit() {
  const { state, sendTransaction } = useConnectWallet()

  return (
    <Paper title="Deposit">
      <DepositWidget
        tokenList={LIST_TOKENS}
        userAddress={state.address}
        // @ts-expect-error
        chainType={state.chainType}
        sendTransactionNear={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.Near,
            tx,
          })
          // For batch transactions, the result is an array with the transaction hash as the second element
          return Array.isArray(result) ? result[1].transaction.hash : result
        }}
        sendTransactionEVM={async (tx) => {
          const result = await sendTransaction({
            id: ChainType.EVM,
            tx,
          })
          return Array.isArray(result) ? result[1].transaction.hash : result
        }}
      />
    </Paper>
  )
}
