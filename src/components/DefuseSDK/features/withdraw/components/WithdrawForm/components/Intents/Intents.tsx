import type { ActorRefFrom } from "xstate"
import { Withdraw1csCard } from "../../../../../../components/IntentCard/Withdraw1csCard"
import type { withdrawStatus1csMachine } from "../../../../../machines/withdrawStatus1csMachine"

export function Intents({
  intentRefs,
}: { intentRefs: ActorRefFrom<typeof withdrawStatus1csMachine>[] }) {
  return (
    <div>
      {intentRefs.map((intentRef) => (
        <Withdraw1csCard
          key={intentRef.id}
          withdrawStatusActorRef={intentRef}
        />
      ))}
    </div>
  )
}
