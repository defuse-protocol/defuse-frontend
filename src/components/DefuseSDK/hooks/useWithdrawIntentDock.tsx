import { useActivityDock } from "@src/providers/ActivityDockProvider"
import { useEffect, useRef } from "react"
import type { ActorRefFrom } from "xstate"
import AssetComboIcon from "../components/Asset/AssetComboIcon"
import WithdrawDockItemContent from "../components/IntentCard/WithdrawDockItemContent"
import type { intentStatusMachine } from "../features/machines/intentStatusMachine"
import { assert } from "../utils/assert"

export function useWithdrawIntentDock(
  intentRefs: ActorRefFrom<typeof intentStatusMachine>[]
) {
  const { addDockItem, hasDockItem } = useActivityDock()
  const addedIdsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    for (const intentRef of intentRefs) {
      const intentId = intentRef.id

      if (addedIdsRef.current.has(intentId) || hasDockItem(intentId)) {
        continue
      }

      const snapshot = intentRef.getSnapshot()
      const { intentDescription } = snapshot.context

      assert(intentDescription.type === "withdraw", "Type must be withdraw")
      const { tokenOut, tokenOutDeployment } = intentDescription

      addDockItem({
        id: intentId,
        type: "custom",
        title: "Withdraw pending...",
        icon: (
          <AssetComboIcon
            sizeClassName="size-8"
            icon={tokenOut.icon}
            chainName={tokenOutDeployment.chainName}
          />
        ),
        renderContent: (updateItem) => (
          <WithdrawDockItemContent
            intentStatusActorRef={intentRef}
            updateItem={updateItem}
          />
        ),
      })

      addedIdsRef.current.add(intentId)
    }
  }, [intentRefs, addDockItem, hasDockItem])
}
