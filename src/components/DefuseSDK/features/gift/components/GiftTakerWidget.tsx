"use client"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { GiftIcon } from "@phosphor-icons/react"
import { useActorRef, useSelector } from "@xstate/react"
import { useEffect, useMemo, useRef, useState } from "react"
import type { ActorRefFrom } from "xstate"
import { WidgetRoot } from "../../../components/WidgetRoot"
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
    <WidgetRoot>
      <SwapWidgetProvider>
        <GiftTakerScreens {...props} />
      </SwapWidgetProvider>
    </WidgetRoot>
  )
}

export function GiftTakerLoadingSkeleton() {
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-start justify-between gap-5 mb-6">
        <div className="flex flex-col gap-3">
          <div className="h-7 w-56 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-5 w-72 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="shrink-0 size-16 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
          <GiftIcon weight="fill" className="size-8 text-gray-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 pr-2.5">
            <div className="size-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-5 w-28 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="text-right">
            <div className="h-7 w-20 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-13 w-full bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </div>
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
    <div style={{ perspective: "1000px" }}>
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
    </div>
  )
}
