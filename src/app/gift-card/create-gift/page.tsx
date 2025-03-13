"use client"

import { GiftMakerWidget } from "@defuse-protocol/defuse-sdk"
import { useDeterminePair } from "@src/app/(home)/_utils/useDeterminePair"
import Paper from "@src/components/Paper"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIntentsReferral } from "@src/hooks/useIntentsReferral"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletAgnosticSignMessage } from "@src/hooks/useWalletAgnosticSignMessage"
import React, { useRef } from "react"
import { createGiftCardLink } from "../_utils/link"
import { safeTokenList } from "../_utils/safeTokenList"

export default function CreateOrderPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(safeTokenList)
  const signMessage = useWalletAgnosticSignMessage()
  const { tokenIn } = useDeterminePair()
  const referral = useIntentsReferral()
  const portalRef = useRef<HTMLDivElement | null>(null)

  return (
    <Paper>
      <div className="flex flex-col items-center">
        <GiftMakerWidget
          tokenList={tokenList}
          userAddress={state.isVerified ? state.address : undefined}
          userChainType={state.chainType}
          signMessage={signMessage}
          referral={referral}
          generateLink={(secretKey) => {
            console.log("secretKey", secretKey)
            return createGiftCardLink(secretKey)
          }}
          initialToken={tokenIn}
          // portalRef={portalRef}
        />
        <div ref={portalRef} className="w-full mt-8" />
      </div>
    </Paper>
  )
}
