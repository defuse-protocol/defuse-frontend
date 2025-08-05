import { useEffect, useRef } from "react"
import type { ActorRefFrom } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { authHandleToIntentsUserId } from "../../../utils/authIdentity"
import type { giftMakerRootMachine } from "../actors/giftMakerRootMachine"
import {
  type GiftMakerHistory,
  useGiftMakerHistory,
} from "../stores/giftMakerHistory"

const EMPTY_GIFTS: GiftMakerHistory[] = []

export function useBalanceUpdaterSyncWithHistory(
  rootActorRef: ActorRefFrom<typeof giftMakerRootMachine>,
  signerCredentials: SignerCredentials | null
) {
  const gifts = useGiftMakerHistory((s) => {
    if (signerCredentials == null) {
      return EMPTY_GIFTS
    }
    const userId = authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    )
    return s.gifts[userId]
  })

  const prevGiftsLengthRef = useRef<number | null>(null)

  useEffect(() => {
    const currentLength = gifts?.length ?? 0
    if (
      prevGiftsLengthRef.current !== null &&
      currentLength < prevGiftsLengthRef.current
    ) {
      rootActorRef.getSnapshot().context.depositedBalanceRef.send({
        type: "REQUEST_BALANCE_REFRESH",
      })
    }
    prevGiftsLengthRef.current = currentLength
  }, [gifts, rootActorRef])
}
