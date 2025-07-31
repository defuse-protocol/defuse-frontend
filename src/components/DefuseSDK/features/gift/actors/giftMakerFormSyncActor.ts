import { fromCallback } from "xstate"
import type { createGiftMakerFormParsedValuesStore } from "./giftMakerFormParsedValues"
import type { createGiftMakerFormValuesStore } from "./giftMakerFormValuesStore"

export const giftFormSyncActor = fromCallback(
  ({
    input,
    sendBack,
  }: {
    input: {
      formValues: ReturnType<typeof createGiftMakerFormValuesStore>
      parsedValues: ReturnType<typeof createGiftMakerFormParsedValuesStore>
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
