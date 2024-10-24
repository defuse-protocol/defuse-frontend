"use client"

import React from "react"

import { DepositWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { SignInType, useConnectWallet } from "@src/hooks/useConnectWallet"

export default function Deposit() {
  const { state, sendTransaction } = useConnectWallet()

  return (
    <Paper title="Deposit">
      <DepositWidget
        tokenList={LIST_TOKENS}
        accountId={state.address || ""}
        sendTransaction={async (transactions) => {
          const transactionResult = await sendTransaction({
            id: SignInType.NearWalletSelector,
            transactions,
          })
          // TODO: handle transaction result
          console.log("transactionResult", transactionResult)
          return ""
        }}
      />
    </Paper>
  )
}
