import { type SnapshotFrom, assign, setup, spawnChild } from "xstate"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import {
  allSetSelector,
  createGiftMakerFormParsedValuesStore,
} from "./giftMakerFormParsedValues"
import { giftFormSyncActor } from "./giftMakerFormSyncActor"
import { createGiftMakerFormValuesStore } from "./giftMakerFormValuesStore"

export const giftMakerFormMachine = setup({
  types: {
    input: {} as {
      initialToken: BaseTokenInfo | UnifiedTokenInfo
    },
    context: {} as {
      isValid: boolean
      formValues: ReturnType<typeof createGiftMakerFormValuesStore>
      parsedValues: ReturnType<typeof createGiftMakerFormParsedValuesStore>
    },
  },
  actors: {
    formSyncActor: giftFormSyncActor,
  },
  actions: {
    validate: assign({
      isValid: ({ context }) => {
        return allSetSelector(context.parsedValues.getSnapshot())
      },
    }),
  },
  guards: {
    isFormValid: ({ context }) => {
      return allSetSelector(context.parsedValues.getSnapshot())
    },
  },
}).createMachine({
  context: ({ input }) => ({
    isValid: false,
    formValues: createGiftMakerFormValuesStore(input),
    parsedValues: createGiftMakerFormParsedValuesStore(),
  }),
  entry: spawnChild("formSyncActor", {
    input: ({ context }) => ({
      formValues: context.formValues,
      parsedValues: context.parsedValues,
    }),
  }),
  on: {
    VALIDATE: {
      actions: "validate",
    },
  },
  initial: "idle",
  states: {
    idle: {},
  },
})

export function formValuesSelector(
  snapshot: SnapshotFrom<typeof giftMakerFormMachine>
) {
  return snapshot.context.formValues
}
