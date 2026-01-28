"use client"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { GiftIcon } from "@phosphor-icons/react"
import { useActorRef, useSelector } from "@xstate/react"
import { useCallback, useEffect, useState } from "react"
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
      <div className="flex items-start justify-between mb-5">
        <div className="flex flex-col gap-2">
          <div className="h-8 w-48 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-gray-100 rounded animate-pulse" />
        </div>
        <div className="size-16 rounded-full bg-gray-200 animate-pulse flex items-center justify-center">
          <GiftIcon weight="fill" className="size-8 text-gray-300" />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-5 w-20 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="text-right">
            <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-4 w-12 bg-gray-100 rounded animate-pulse" />
          </div>
        </div>
      </div>

      <div className="mt-5">
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
