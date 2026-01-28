import { logger } from "@src/utils/logger"
import { assign, fromPromise, setup } from "xstate"

export const walletVerificationMachine = setup({
  types: {} as {
    context: {
      hadError: boolean
      token: string | null
      expiresAt: number | null
    }
    output: { token: string; expiresAt: number }
  },
  actors: {
    verifyWallet: fromPromise(
      (): Promise<{ token: string; expiresAt: number } | null> => {
        throw new Error("not implemented")
      }
    ),
  },
  actions: {
    logError: (_, { error }: { error: unknown }) => {
      logger.error(error)
    },
    setError: assign({
      hadError: (_, { hadError }: { hadError: true }) => hadError,
    }),
    setToken: assign({
      token: (_, { token }: { token: string; expiresAt: number }) => token,
      expiresAt: (_, { expiresAt }: { token: string; expiresAt: number }) =>
        expiresAt,
    }),
  },
  guards: {
    hasToken: (_, value: { token: string; expiresAt: number } | null) =>
      value != null,
  },
}).createMachine({
  id: "verify-wallet",
  initial: "idle",
  context: {
    hadError: false,
    token: null,
    expiresAt: null,
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
              type: "hasToken",
              params: ({ event }) => event.output,
            },
            actions: {
              type: "setToken",
              params: ({ event }) => {
                if (!event.output) {
                  throw new Error("Expected token output")
                }
                return event.output
              },
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
      output: ({ context }) => ({
        token: context.token ?? "",
        expiresAt: context.expiresAt ?? 0,
      }),
    },
    aborted: {
      type: "final",
    },
  },
})
