import { DepositCard } from "@src/components/DefuseSDK/components/IntentCard/DepositCard"
import { Fragment } from "react"
import type { ActorRefFrom } from "xstate"
import type { depositStatusMachine } from "../../../machines/depositStatusMachine"

export function Intents({
  intentRefs,
}: {
  intentRefs: ActorRefFrom<typeof depositStatusMachine>[]
}) {
  return (
    <div>
      {intentRefs.map((intentRef) => {
        return (
          <Fragment key={intentRef.id}>
            <DepositCard
              depositStatusActorRef={
                intentRef as ActorRefFrom<typeof depositStatusMachine>
              }
            />
          </Fragment>
        )
      })}
    </div>
  )
}
