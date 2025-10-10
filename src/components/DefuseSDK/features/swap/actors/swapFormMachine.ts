import { type SnapshotFrom, assign, setup, spawnChild } from "xstate"
import type { TokenInfo } from "../../../types/base"
import {
  allSetSelector,
  createSwapFormParsedValuesStore,
} from "./swapFormParsedValues"
import { swapFormSyncActor } from "./swapFormSyncActor"
import { createSwapFormValuesStore } from "./swapFormValuesStore"

export const swapFormMachine = setup({
  types: {
    input: {} as {
      initialTokenIn: TokenInfo
      initialTokenOut: TokenInfo
    },
    context: {} as {
      isValid: boolean
      formValues: ReturnType<typeof createSwapFormValuesStore>
      parsedValues: ReturnType<typeof createSwapFormParsedValuesStore>
    },
  },
  actors: {
    formSyncActor: swapFormSyncActor,
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
    formValues: createSwapFormValuesStore(input),
    parsedValues: createSwapFormParsedValuesStore(),
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
  snapshot: SnapshotFrom<typeof swapFormMachine>
) {
  return snapshot.context.formValues
}
