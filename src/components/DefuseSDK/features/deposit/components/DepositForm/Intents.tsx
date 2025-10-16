import { Deposit1csCard } from "@src/components/DefuseSDK/components/IntentCard/Deposit1csCard"
import { Fragment } from "react"
import type { ActorRefFrom } from "xstate"
import type { oneClickStatusMachine } from "../../../machines/oneClickStatusMachine"

export function Intents({
  intentRefs,
}: {
  intentRefs: ActorRefFrom<typeof oneClickStatusMachine>[]
}) {
  return (
    <div>
      {intentRefs.map((intentRef) => {
        return (
          <Fragment key={intentRef.id}>
            <Deposit1csCard
              oneClickStatusActorRef={
                intentRef as ActorRefFrom<typeof oneClickStatusMachine>
              }
            />
          </Fragment>
        )
      })}
    </div>
  )
}
