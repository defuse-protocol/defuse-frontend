"use client"

import { GiftTakerWidget } from "@defuse-protocol/defuse-sdk"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"
import React from "react"
import { useGiftIntent } from "../_utils/link"

export default function ViewGiftPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const { payload, giftId } = useGiftIntent()

  return (
    <Paper>
      <GiftTakerWidget
        // TODO: Enable in next @defuse-protocol/defuse-sdk release
        // giftId={giftId}
        payload={payload}
        tokenList={tokenList}
        userAddress={state.isVerified ? state.address : undefined}
        userChainType={state.chainType}
        renderHostAppLink={renderAppLink}
      />
    </Paper>
  )
}
