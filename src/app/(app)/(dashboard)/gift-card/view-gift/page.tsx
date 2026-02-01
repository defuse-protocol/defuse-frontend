"use client"

import { GiftTakerWidget } from "@src/components/DefuseSDK/features/gift/components/GiftTakerWidget"
import Paper from "@src/components/Paper"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { renderAppLink } from "@src/utils/renderAppLink"

import { useGiftIntent } from "../_utils/link"

export default function ViewGiftPage() {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const {
    payload,
    // giftId
  } = useGiftIntent()

  return (
    <Paper>
      {/* @ts-expect-error TODO: Enable in next @defuse-protocol/defuse-sdk release */}
      <GiftTakerWidget
        // giftId={giftId}
        payload={payload}
        tokenList={tokenList}
        userAddress={state.isAuthorized ? state.address : undefined}
        userChainType={state.chainType}
        renderHostAppLink={renderAppLink}
      />
    </Paper>
  )
}
