import { fromPromise, setup } from "xstate"

export const walletConfirmationMachine = setup({
  actors: {
    confirmWallet: fromPromise((): Promise<boolean> => {
      throw new Error("not implemented")
    }),
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      console.error(error)
    },
  },
}).createMachine({
  id: "confirm-wallet",
  initial: "idle",
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
          target: "error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
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
