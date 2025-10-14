import { fromCallback } from "xstate"
import type { createSwapFormParsedValuesStore } from "./swapFormParsedValues"
import type { createSwapFormValuesStore } from "./swapFormValuesStore"

export const swapFormSyncActor = fromCallback(
  ({
    input,
    sendBack,
  }: {
    input: {
      formValues: ReturnType<typeof createSwapFormValuesStore>
      parsedValues: ReturnType<typeof createSwapFormParsedValuesStore>
    }
    sendBack: (event: { type: "VALIDATE"; dry?: boolean }) => void
  }) => {
    const sub = input.formValues.on("changed", ({ context, dry }) => {
      input.parsedValues.trigger.parseValues({ formValues: context })

      // Send VALIDATE immediately with the dry flag from the changed event
      sendBack({ type: "VALIDATE", dry: dry === true })
    })

    return () => {
      sub.unsubscribe()
    }
  }
)
