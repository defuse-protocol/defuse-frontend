import { useSelector } from "@xstate/react"
import { type PropsWithChildren, useEffect, useRef } from "react"
import { useFormContext } from "react-hook-form"
import type { AuthMethod } from "../../../types/authHandle"
import type { SwapWidgetProps } from "../../../types/swap"
import { usePublicKeyModalOpener } from "../hooks/usePublicKeyModalOpener"
import type { SwapFormValues } from "./SwapForm"
import { SwapUIMachineContext } from "./SwapUIMachineProvider"

type SwapUIMachineFormSyncProviderProps = PropsWithChildren<{
  userAddress: string | null
  userChainType: AuthMethod | null
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
  const { watch, setValue } = useFormContext<SwapFormValues>()
  const actorRef = SwapUIMachineContext.useActorRef()

  // Make `onSuccessSwap` stable reference, waiting for `useEvent` hook to come out
  const onSuccessSwapRef = useRef(onSuccessSwap)
  onSuccessSwapRef.current = onSuccessSwap

  useEffect(() => {
    const sub = watch(async (value, { name }) => {
      if (name != null && name === "amountIn") {
        actorRef.send({
          type: "input",
          params: { [name]: value[name] },
        })
      }
    })
    return () => {
      sub.unsubscribe()
    }
  }, [watch, actorRef])

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
          setValue("amountIn", "")
          break
        }

        case "INTENT_SETTLED": {
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
  }, [actorRef, setValue])

  const swapRef = useSelector(actorRef, (state) => state.children.swapRef)
  const publicKeyVerifierRef = useSelector(swapRef, (state) => {
    if (state) {
      return state.children.publicKeyVerifierRef
    }
  })

  // biome-ignore lint/suspicious/noExplicitAny: types should've been correct, but `publicKeyVerifierRef` is commented out
  usePublicKeyModalOpener(publicKeyVerifierRef as any, sendNearTransaction)

  return <>{children}</>
}
