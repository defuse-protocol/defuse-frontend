import type { ActorRefFrom } from "xstate"
import { WithdrawIntentCard } from "../../../../../../components/IntentCard/WithdrawIntentCard"
import type { intentStatusMachine } from "../../../../../machines/intentStatusMachine"

export function Intents({
  intentRefs,
}: { intentRefs: ActorRefFrom<typeof intentStatusMachine>[] }) {
  return (
    <div>
      {intentRefs.map((intentRef) => (
        <WithdrawIntentCard
          key={intentRef.id}
          intentStatusActorRef={intentRef}
        />
      ))}
    </div>
  )
}
