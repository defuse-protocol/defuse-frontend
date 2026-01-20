import type { authHandle } from "@defuse-protocol/internal-utils"
import { useSwapTracker } from "@src/providers/SwapTrackerProvider"
import { useSelector } from "@xstate/react"
import { type PropsWithChildren, useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import { queryClient } from "../../../providers/QueryClientProvider"
import type { SwapWidgetProps } from "../../../types/swap"
import type { IntentDescription } from "../../machines/swapIntentMachine"
import { usePublicKeyModalOpener } from "../hooks/usePublicKeyModalOpener"
import type { SwapFormValues } from "./SwapForm"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

type SwapUIMachineFormSyncProviderProps = PropsWithChildren<{
  userAddress: authHandle.AuthHandle["identifier"] | undefined
  userChainType: authHandle.AuthHandle["method"] | undefined
  onSuccessSwap: SwapWidgetProps["onSuccessSwap"]
  sendNearTransaction: SwapWidgetProps["sendNearTransaction"]
}>

export function SwapUIMachineFormSyncProvider({
  children,
  userAddress,
  userChainType,
  onSuccessSwap,
  sendNearTransaction,
}: SwapUIMachineFormSyncProviderProps) {
  const { reset } = useFormContext<SwapFormValues>()
  const actorRef = SwapUIMachineContext.useActorRef()
  const { registerSwap, hasActiveSwap } = useSwapTracker()

  // Make `onSuccessSwap` stable reference, waiting for `useEvent` hook to come out
  const onSuccessSwapRef = useRef(onSuccessSwap)
  onSuccessSwapRef.current = onSuccessSwap

  useEffect(() => {
    if (userAddress == null || userChainType == null) {
      actorRef.send({ type: "LOGOUT" })
    } else {
      actorRef.send({ type: "LOGIN", params: { userAddress, userChainType } })
    }
  }, [actorRef, userAddress, userChainType])

  useEffect(() => {
    const sub = actorRef.on("*", (event) => {
      switch (event.type) {
        case "INTENT_PUBLISHED": {
          queryClient.invalidateQueries({ queryKey: ["swap_history"] })
          reset()

          const snapshot = actorRef.getSnapshot()
          const intentCreationResult = snapshot.context.intentCreationResult
          const { tokenIn, tokenOut } = snapshot.context.formValues
          const is1cs = snapshot.context.is1cs

          if (intentCreationResult?.tag === "ok") {
            const { intentHash, intentDescription } = intentCreationResult.value
            const depositAddress =
              "depositAddress" in intentCreationResult.value
                ? intentCreationResult.value.depositAddress
                : undefined

            const swapId = depositAddress ?? intentHash
            if (!hasActiveSwap(swapId)) {
              registerSwap({
                intentHash,
                depositAddress,
                tokenIn,
                tokenOut,
                intentDescription: intentDescription as IntentDescription,
                is1cs,
                parentRef: actorRef,
              })
            }
          }
          break
        }

        case "INTENT_SETTLED": {
          queryClient.invalidateQueries({ queryKey: ["swap_history"] })
          onSuccessSwapRef.current({
            amountIn: 0n, // todo: remove amount fields, as they may not exist for all types of intents
            amountOut: 0n,
            tokenIn: event.data.tokenIn,
            tokenOut: event.data.tokenOut,
            txHash: event.data.txHash,
            intentHash: event.data.intentHash,
          })
          break
        }
      }
    })

    return () => {
      sub.unsubscribe()
    }
  }, [actorRef, reset, registerSwap, hasActiveSwap])

  const swapRef = useSelector(
    actorRef,
    (state) => state.children.swapRef ?? state.children.swapRef1cs
  )
  const publicKeyVerifierRef = useSelector(swapRef, (state) => {
    if (state) {
      return state.children.publicKeyVerifierRef
    }
  })

  // biome-ignore lint/suspicious/noExplicitAny: types should've been correct, but `publicKeyVerifierRef` is commented out
  usePublicKeyModalOpener(publicKeyVerifierRef as any, sendNearTransaction)

  return <>{children}</>
}
