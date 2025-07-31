import { assign, fromPromise, setup } from "xstate"
import { nearClient } from "../../../constants/nearClient"
import { getProtocolFee } from "../../../services/intentsContractService"

export const otcMakerConfigLoadActor = setup({
  types: {
    context: {} as {
      protocolFee: null | number
    },
  },
  actors: {
    loadProtocolFee: fromPromise(() => getProtocolFee({ nearClient })),
  },
  actions: {
    setProtocolFee: assign({
      protocolFee: (_, event: { output: number }) => event.output,
    }),
  },
}).createMachine({
  context: {
    protocolFee: null,
  },

  initial: "loading",

  states: {
    loading: {
      invoke: {
        src: "loadProtocolFee",
        onDone: {
          target: "loaded",
          actions: {
            type: "setProtocolFee",
            params: ({ event }) => event,
          },
        },
        onError: "error",
      },
    },
    loaded: {
      type: "final",
    },
    error: {
      after: {
        1000: "loading",
      },
    },
  },
})
