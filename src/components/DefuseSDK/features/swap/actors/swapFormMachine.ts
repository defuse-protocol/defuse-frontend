import {
  type AnyActorRef,
  type SnapshotFrom,
  assign,
  setup,
  spawnChild,
} from "xstate"
import type { TokenInfo } from "../../../types/base"
import {
  allSetSelector,
  createSwapFormParsedValuesStore,
} from "./swapFormParsedValues"
import { swapFormSyncActor } from "./swapFormSyncActor"
import { createSwapFormValuesStore } from "./swapFormValuesStore"

type ParentActor = AnyActorRef

export const swapFormMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      initialTokenIn: TokenInfo
      initialTokenOut: TokenInfo
    },
    context: {} as {
      isValid: boolean
      formValues: ReturnType<typeof createSwapFormValuesStore>
      parsedValues: ReturnType<typeof createSwapFormParsedValuesStore>
      parentRef: ParentActor
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
    notifyParent: ({ context, event }) => {
      // Only notify parent if this is not a dry update (amountOut change), to avoid NEW quote request
      if (event.dry !== true) {
        context.parentRef.send({ type: "input" })
      }
    },
  },
}).createMachine({
  context: ({ input }) => ({
    isValid: false,
    formValues: createSwapFormValuesStore(input),
    parsedValues: createSwapFormParsedValuesStore(),
    parentRef: input.parentRef,
  }),
  entry: spawnChild("formSyncActor", {
    input: ({ context }) => ({
      formValues: context.formValues,
      parsedValues: context.parsedValues,
    }),
  }),
  on: {
    VALIDATE: {
      actions: ["validate", "notifyParent"],
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
