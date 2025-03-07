"use client"

import { GiftTakerWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import React from "react"
import { useGiftCard } from "../_utils/link"
import { safeTokenList } from "../_utils/safeTokenList"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(safeTokenList)
  const secretKey = useGiftCard()

  return (
    <Paper>
      <GiftTakerWidget
        secretKey={secretKey}
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        userChainType={state.chainType}
      />
    </Paper>
  )
}
