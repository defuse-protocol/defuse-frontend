import { type SnapshotFrom, assign, setup, spawnChild } from "xstate"
import type { TokenInfo } from "../../../types/base"
import {
  allSetSelector,
  createOTCMakerFormParsedValuesStore,
} from "./otcMakerFormParsedValues"
import { otcMakerFormSyncActor } from "./otcMakerFormSyncActor"
import { createOTCMakerFormValuesStore } from "./otcMakerFormValuesStore"

export const otcMakerFormMachine = setup({
  types: {
    input: {} as {
      initialTokenIn: TokenInfo
      initialTokenOut: TokenInfo
    },
    context: {} as {
      isValid: boolean
      formValues: ReturnType<typeof createOTCMakerFormValuesStore>
      parsedValues: ReturnType<typeof createOTCMakerFormParsedValuesStore>
    },
  },
  actors: {
    formSyncActor: otcMakerFormSyncActor,
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
    formValues: createOTCMakerFormValuesStore(input),
    parsedValues: createOTCMakerFormParsedValuesStore(),
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
  snapshot: SnapshotFrom<typeof otcMakerFormMachine>
) {
  return snapshot.context.formValues
}
