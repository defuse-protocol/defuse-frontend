"use client"

import React from "react"

import { OtcTakerWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import { useOTCOrder } from "../_utils/link"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const signMessage = useWalletAgnosticSignMessage()
  const multiPayload = useOTCOrder()

  return (
    <Paper>
      <OtcTakerWidget
        multiPayload={multiPayload}
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        userChainType={state.chainType}
        signMessage={signMessage}
      />
    </Paper>
  )
}
