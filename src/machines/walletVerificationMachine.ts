import { assign, fromPromise, setup } from "xstate"

export const walletVerificationMachine = setup({
  types: {} as {
    context: {
      hadError: boolean
    }
  },
  actors: {
    verifyWallet: fromPromise((): Promise<boolean> => {
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
  id: "verify-wallet",
  initial: "idle",
  context: {
    hadError: false,
  },
  states: {
    idle: {
      on: {
        START: "verifying",
        ABORT: "aborted",
      },
    },
    error: {
      on: {
        START: "verifying",
        ABORT: "aborted",
      },
    },
    verifying: {
      invoke: {
        src: "verifyWallet",
        onDone: {
          target: "verified",
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
    verified: {
      type: "final",
    },
    aborted: {
      type: "final",
    },
  },
})
