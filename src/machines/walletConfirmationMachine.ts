import { assign, fromPromise, setup } from "xstate"

export const walletConfirmationMachine = setup({
  types: {} as {
    context: {
      hadError: boolean
    }
  },
  actors: {
    confirmWallet: fromPromise((): Promise<boolean> => {
      throw new Error("not implemented")
    }),
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      console.error(error)
    },
    setError: assign({
      hadError: (_, { hadError }: { hadError: true }) => hadError,
    }),
  },
}).createMachine({
  id: "confirm-wallet",
  initial: "idle",
  context: {
    hadError: false,
  },
  states: {
    idle: {
      on: {
        START: "confirming",
        ABORT: "aborted",
      },
    },
    error: {
      on: {
        START: "confirming",
        ABORT: "aborted",
      },
    },
    confirming: {
      invoke: {
        src: "confirmWallet",
        onDone: {
          target: "confirmed",
        },
        onError: {
          target: "idle",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: { hadError: true },
            },
          ],
        },
      },
    },
    confirmed: {
      type: "final",
    },
    aborted: {
      type: "final",
    },
  },
})
