import { logger } from "@src/utils/logger"
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
      logger.error(error)
    },
    setError: assign({
      hadError: (_, { hadError }: { hadError: true }) => hadError,
    }),
  },
  guards: {
    isTrue: (_, value: boolean) => value,
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
        onDone: [
          {
            target: "verified",
            guard: {
              type: "isTrue",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "idle",
            actions: [
              {
                type: "logError",
                params: {
                  error: "Wallet produced an unverifiable signature",
                },
              },
              {
                type: "setError",
                params: { hadError: true },
              },
            ],
          },
        ],
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
