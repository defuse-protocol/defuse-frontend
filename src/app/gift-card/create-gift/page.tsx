"use client"

import { GiftHistoryWidget, GiftMakerWidget } from "@defuse-protocol/defuse-sdk"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import React from "react"
import { createGiftCardLink } from "../_utils/link"

export default function CreateGiftPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
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
          generateLink={(giftLinkData) => createGiftCardLink(giftLinkData)}
          initialToken={tokenIn}
        />
        <GiftHistoryWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          generateLink={(giftLinkData) => createGiftCardLink(giftLinkData)}
        />
      </div>
    </Paper>
  )
}
