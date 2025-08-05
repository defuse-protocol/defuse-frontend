import { fromCallback } from "xstate"
import type { createOTCMakerFormParsedValuesStore } from "./otcMakerFormParsedValues"
import type { createOTCMakerFormValuesStore } from "./otcMakerFormValuesStore"

export const otcMakerFormSyncActor = fromCallback(
  ({
    input,
    sendBack,
  }: {
    input: {
      formValues: ReturnType<typeof createOTCMakerFormValuesStore>
      parsedValues: ReturnType<typeof createOTCMakerFormParsedValuesStore>
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
