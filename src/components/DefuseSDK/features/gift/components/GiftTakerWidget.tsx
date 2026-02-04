"use client"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { useActorRef, useSelector } from "@xstate/react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ActorRefFrom } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { SwapWidgetProvider } from "../../../providers/SwapWidgetProvider"
import type { TokenInfo } from "../../../types/base"
import type { RenderHostAppLink } from "../../../types/hostAppLink"
import { giftTakerRootMachine } from "../actors/giftTakerRootMachine"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { GiftRevealCard } from "./GiftRevealCard"
import { GiftTakerForm } from "./GiftTakerForm"
import { GiftTakerInvalidClaim } from "./GiftTakerInvalidClaim"
import { GiftTakerSuccessScreen } from "./GiftTakerSuccessScreen"

export type GiftTakerWidgetProps = {
  giftId: string | null
  payload: string | null
  tokenList: TokenInfo[]
  userAddress: string | null | undefined
  userChainType: AuthMethod | null | undefined
  theme?: "dark" | "light"
  renderHostAppLink: RenderHostAppLink
  externalError?: string | null
}

export function GiftTakerWidget(props: GiftTakerWidgetProps) {
  return (
    <SwapWidgetProvider>
      <GiftTakerScreens {...props} />
    </SwapWidgetProvider>
  )
}

export function GiftTakerLoadingSkeleton() {
  return (
    <>
      <div className="h-7 flex items-center w-full max-w-48">
        <div className="rounded-sm bg-gray-200 animate-pulse w-full h-5" />
      </div>
      <div className="mt-1 h-5 flex items-center w-full max-w-82">
        <div className="rounded-sm bg-gray-200 animate-pulse w-full h-3.5" />
      </div>

      <div className="mt-7 rounded-3xl border border-gray-200 bg-white p-5 pt-12 flex flex-col items-center">
        <div className="size-13 rounded-full bg-gray-200 animate-pulse" />
        <div className="mt-5 h-7 flex items-center w-full max-w-32">
          <div className="rounded-sm bg-gray-200 animate-pulse w-full h-6" />
        </div>

        <div className="w-full bg-gray-200 h-13 mt-7 rounded-2xl" />
      </div>
    </>
  )
}

function GiftTakerScreens({
  giftId,
  payload,
  tokenList,
  userAddress,
  userChainType,
  renderHostAppLink,
  externalError,
}: GiftTakerWidgetProps) {
  const [resetKey, setResetKey] = useState(0)

  // Memoize input to prevent useActorRef from seeing new object references
  const machineInput = useMemo(
    () => ({
      giftId,
      payload,
      tokenList,
    }),
    [giftId, payload, tokenList]
  )

  const giftTakerRootRef = useActorRef(giftTakerRootMachine, {
    input: machineInput,
  })

  // Use ref to avoid including giftTakerRootRef in effect dependencies
  const actorRefRef = useRef(giftTakerRootRef)
  actorRefRef.current = giftTakerRootRef

  // Use separate selectors to avoid creating new objects on every render
  const giftTakerClaimRef = useSelector(
    giftTakerRootRef,
    (state) =>
      state.children.giftTakerClaimRef as
        | undefined
        | ActorRefFrom<typeof giftClaimActor>
  )
  const intentHashes = useSelector(
    giftTakerRootRef,
    (state) => state.context.intentHashes
  )
  const giftInfo = useSelector(
    giftTakerRootRef,
    (state) => state.context.giftInfo
  )
  const rootError = useSelector(
    giftTakerRootRef,
    (state) => state.context.error
  )

  const claimError = useSelector(
    giftTakerClaimRef,
    (state) => state?.context.error
  )
  const error = claimError ?? rootError

  // Send SET_DATA only when payload or giftId changes, not on every render
  useEffect(() => {
    if (payload) {
      actorRefRef.current.send({
        type: "SET_DATA",
        params: { payload, giftId },
      })
    }
  }, [payload, giftId])

  const signerCredentials: SignerCredentials | null =
    userAddress != null && userChainType != null
      ? { credential: userAddress, credentialType: userChainType }
      : null

  if (externalError != null) {
    return <GiftTakerInvalidClaim error={externalError} />
  }

  if (error != null) {
    return <GiftTakerInvalidClaim error={error.reason} />
  }

  if (giftInfo == null) {
    return <GiftTakerLoadingSkeleton />
  }

  if (intentHashes) {
    return (
      <GiftTakerSuccessScreen giftInfo={giftInfo} intentHashes={intentHashes} />
    )
  }

  return (
    <GiftRevealCard key={resetKey} giftId={giftId ?? "unknown"}>
      <GiftTakerForm
        giftId={giftId ?? "unknown"}
        giftInfo={giftInfo}
        signerCredentials={signerCredentials}
        giftTakerRootRef={giftTakerRootRef}
        intentHashes={intentHashes}
        renderHostAppLink={renderHostAppLink}
        onReset={() => setResetKey((k) => k + 1)}
      />
    </GiftRevealCard>
  )
}
