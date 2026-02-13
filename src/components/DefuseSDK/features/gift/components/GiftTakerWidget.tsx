"use client"

import { useGiftIntent } from "@src/app/(app)/(dashboard)/gifts/_utils/link"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useActorRef, useSelector } from "@xstate/react"
import { useEffect, useMemo, useRef } from "react"
import type { ActorRefFrom } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { giftTakerRootMachine } from "../actors/giftTakerRootMachine"
import type { giftClaimActor } from "../actors/shared/giftClaimActor"
import { GiftTakerForm } from "./GiftTakerForm"
import { GiftTakerInvalidClaim } from "./GiftTakerInvalidClaim"
import { GiftTakerSuccessScreen } from "./GiftTakerSuccessScreen"

export function GiftTakerWidget() {
  const { state, isLoading } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const { payload, giftId, error: externalError } = useGiftIntent()

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
  const error = externalError ?? claimError?.reason ?? rootError?.reason

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
    state.address != null && state.chainType != null
      ? { credential: state.address, credentialType: state.chainType }
      : null

  if (error != null) {
    return <GiftTakerInvalidClaim error={error} />
  }

  if (isLoading || giftInfo == null) {
    return <GiftTakerLoadingSkeleton loggedIn={signerCredentials != null} />
  }

  if (intentHashes) {
    return (
      <GiftTakerSuccessScreen giftInfo={giftInfo} intentHashes={intentHashes} />
    )
  }

  return (
    <GiftTakerForm
      giftInfo={giftInfo}
      signerCredentials={signerCredentials}
      giftTakerRootRef={giftTakerRootRef}
      intentHashes={intentHashes}
    />
  )
}

function GiftTakerLoadingSkeleton({ loggedIn }: { loggedIn: boolean }) {
  return (
    <>
      <div className="flex flex-col">
        <div className="h-7 md:h-10 flex flex-col justify-center">
          <div className="h-6 md:h-9 w-3/4 bg-gray-200 animate-pulse rounded-lg" />
        </div>
        <div className="h-7 md:h-10 flex flex-col justify-center">
          <div className="h-6 md:h-9 w-2/4 bg-gray-200 animate-pulse rounded-lg" />
        </div>
      </div>

      <div className="mt-5 w-full h-14.5 md:h-16.5 rounded-3xl bg-gray-200 animate-pulse" />

      <div className="mt-8 md:mt-12 w-full h-13 rounded-2xl bg-gray-200 animate-pulse" />

      {!loggedIn && (
        <div className="mt-3 h-5 flex flex-col justify-center">
          <div className="h-3 mx-auto w-3/4 bg-gray-200 animate-pulse rounded-md" />
        </div>
      )}
    </>
  )
}
