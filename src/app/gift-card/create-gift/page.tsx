"use client"

import { GiftHistoryWidget, GiftMakerWidget } from "@defuse-protocol/defuse-sdk"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import React from "react"
import { createGiftCardLink } from "../_utils/link"
import { safeTokenList } from "../_utils/safeTokenList"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(safeTokenList)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()

  return (
    <Paper>
      <div className="flex flex-col items-center gap-8">
        <GiftMakerWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          signMessage={signMessage}
          referral={referral}
          generateLink={(giftPayload) => {
            console.log("giftPayload", giftPayload)
            return createGiftCardLink(giftPayload)
          }}
          initialToken={tokenIn}
        />
        <GiftHistoryWidget
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          generateLink={(secretKey) => createGiftCardLink(secretKey)}
        />
      </div>
    </Paper>
  )
}
