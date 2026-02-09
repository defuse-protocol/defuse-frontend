"use client"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { useActorRef, useSelector } from "@xstate/react"
import { useCallback, useEffect, useRef } from "react"
import type { ActorRefFrom } from "xstate"
import { WidgetRoot } from "../../../components/WidgetRoot"
import type { SignerCredentials } from "../../../core/formatters"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"
import { emitEvent } from "../../../services/emitter"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { giftTakerRootMachine } from "../actors/giftTakerRootMachine"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { GiftTakerForm } from "./GiftTakerForm"
import { GiftTakerInvalidClaim } from "./GiftTakerInvalidClaim"
import { GiftTakerSuccessScreen } from "./GiftTakerSuccessScreen"

export type GiftTakerWidgetProps = {
  giftId: string | null
  payload: string | null

  /** List of available tokens for trading */
  tokenList: TokenInfo[]

  /** User's wallet address */
  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined

  /** Theme selection */
  theme?: "dark" | "light"

  renderHostAppLink: RenderHostAppLink
}

export function GiftTakerWidget(props: GiftTakerWidgetProps) {
  return (
    <WidgetRoot>
      <SwapWidgetProvider>
        <div className="widget-container rounded-2xl bg-gray-1 p-5 shadow-sm">
          <GiftTakerScreens {...props} />
        </div>
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}

function GiftTakerScreens({
  giftId,
  payload,
  tokenList,
  userAddress,
  userChainType,
  renderHostAppLink,
}: GiftTakerWidgetProps) {
  const loading = <div>Loading...</div>

  const giftTakerRootRef = useActorRef(giftTakerRootMachine, {
    input: {
      giftId,
      payload,
      tokenList,
    },
  })

  const { snapshot, giftTakerClaimRef } = useSelector(
    giftTakerRootRef,
    (state) => ({
      giftTakerClaimRef: state.children.giftTakerClaimRef as
        | undefined
        | ActorRefFrom<typeof giftClaimActor>,
      snapshot: state,
    })
  )
  const intentHashes = snapshot.context.intentHashes
  const giftInfo = snapshot.context.giftInfo

  const claimSnapshot = useSelector(giftTakerClaimRef, (state) => state)
  const error = claimSnapshot?.context.error ?? snapshot.context.error

  const setData = useCallback(() => {
    if (payload) {
      giftTakerRootRef.send({ type: "SET_DATA", params: { payload, giftId } })
    }
  }, [giftTakerRootRef, payload, giftId])

  useEffect(() => {
    setData()
  }, [setData])

  const signerCredentials: SignerCredentials | null =
    userAddress != null && userChainType != null
      ? { credential: userAddress, credentialType: userChainType }
      : null

  const hasEmittedViewRef = useRef(false)
  useEffect(() => {
    if (giftInfo != null && !hasEmittedViewRef.current) {
      hasEmittedViewRef.current = true
      emitEvent("gift_link_viewed", {
        gift_token: giftInfo.token.symbol,
        viewer_has_account: userAddress != null,
      })
    }
  }, [giftInfo, userAddress])

  if (error != null) {
    return <GiftTakerInvalidClaim error={error.reason} />
  }

  if (giftInfo == null) {
    return loading
  }

  return (
    <>
      {intentHashes ? (
        <GiftTakerSuccessScreen
          giftInfo={giftInfo}
          intentHashes={intentHashes}
          renderHostAppLink={renderHostAppLink}
        />
      ) : (
        <GiftTakerForm
          giftInfo={giftInfo}
          signerCredentials={signerCredentials}
          giftTakerRootRef={giftTakerRootRef}
          intentHashes={intentHashes}
          renderHostAppLink={renderHostAppLink}
        />
      )}
    </>
  )
}
