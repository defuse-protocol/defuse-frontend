import { useEffect } from "react"
import type { ActorRefFrom } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import type { giftMakerRootMachine } from "../actors/giftMakerRootMachine"

export function useCheckSignerCredentials(
  rootActorRef: ActorRefFrom<typeof giftMakerRootMachine>,
  signerCredentials: SignerCredentials | null
) {
  useEffect(() => {
    if (signerCredentials == null) {
      rootActorRef.send({ type: "LOGOUT" })
    } else {
      rootActorRef.send({
        type: "LOGIN",
        params: {
          userAddress: signerCredentials.credential,
          userChainType: signerCredentials.credentialType,
        },
      })
    }
  }, [rootActorRef, signerCredentials])
}
