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
    sendBack: (event: { type: "VALIDATE" }) => void
  }) => {
    const sub = input.formValues.on("changed", ({ context }) => {
      input.parsedValues.trigger.parseValues({ formValues: context })
    })

    const sub2 = input.parsedValues.on("valuesParsed", () => {
      sendBack({ type: "VALIDATE" })
    })

    return () => {
      sub.unsubscribe()
      sub2.unsubscribe()
    }
  }
)
