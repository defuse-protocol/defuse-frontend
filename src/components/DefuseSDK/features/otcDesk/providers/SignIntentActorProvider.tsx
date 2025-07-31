import { Err, type Result } from "@thames/monads"
import { useSelector } from "@xstate/react"
import { type ReactNode, createContext, useEffect, useState } from "react"
import { type ActorRefFrom, createActor, toPromise } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import type { WalletMessage } from "../../../types/walletMessage"
import type { SendNearTransaction } from "../../machines/publicKeyVerifierMachine"
import {
  type Errors,
  type Success,
  signIntentMachine,
} from "../../machines/signIntentMachine"
import { usePublicKeyModalOpener } from "../../swap/hooks/usePublicKeyModalOpener"
import type { SignMessage } from "../types/sharedTypes"
import { toResult } from "../utils/monadsUtils"

export type SignIntentErr = Errors | { reason: "SIGNING_IN_PROGRESS" }
export type SignIntentOk = Success

export const SignIntentContext = createContext<{
  signIntent: (arg: {
    signerCredentials: SignerCredentials
    signMessage: SignMessage
    walletMessage: WalletMessage
  }) => Promise<Result<SignIntentOk, SignIntentErr>>
}>({
  signIntent: async () => {
    throw new Error("not implemented")
  },
})

export function SignIntentActorProvider({
  children,
  sendNearTransaction,
}: { children: ReactNode; sendNearTransaction: SendNearTransaction }) {
  const [actorRef, setActorRef] = useState<ActorRefFrom<
    typeof signIntentMachine
  > | null>(null)

  useEffect(() => {
    return () => {
      if (actorRef) {
        actorRef.stop()
      }
    }
  }, [actorRef])

  const clearActorRef = () => {
    setActorRef(null)
  }

  const signIntent = async ({
    signerCredentials,
    signMessage,
    walletMessage,
  }: {
    signerCredentials: SignerCredentials
    signMessage: SignMessage
    walletMessage: WalletMessage
  }) => {
    if (actorRef) {
      return Err<SignIntentOk, SignIntentErr>({ reason: "SIGNING_IN_PROGRESS" })
    }

    const actor = createActor(signIntentMachine, {
      input: {
        signerCredentials,
        signMessage,
        walletMessage,
      },
    })

    setActorRef(actor)

    actor.start()

    return toPromise(actor).then(toResult).finally(clearActorRef)
  }

  const publicKeyVerifierRef = useSelector(actorRef ?? undefined, (state) => {
    if (state) {
      return state.children.publicKeyVerifierRef
    }
  })

  // @ts-expect-error ???
  usePublicKeyModalOpener(publicKeyVerifierRef, sendNearTransaction)

  return (
    <SignIntentContext.Provider value={{ signIntent }}>
      {children}
    </SignIntentContext.Provider>
  )
}
