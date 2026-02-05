import { logger } from "@src/utils/logger"
import { assign, fromPromise, setup } from "xstate"

export interface VerificationResult {
  success: boolean
  token?: string
  expiresAt?: number
}

export const walletVerificationMachine = setup({
  types: {} as {
    context: {
      hadError: boolean
      verificationResult: VerificationResult | null
    }
  },
  actors: {
    verifyWallet: fromPromise((): Promise<VerificationResult> => {
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
    setVerificationResult: assign({
      verificationResult: (
        _,
        { result }: { result: VerificationResult | null }
      ) => result,
    }),
  },
  guards: {
    isVerified: (_, result: VerificationResult) => result.success === true,
  },
}).createMachine({
  id: "verify-wallet",
  initial: "idle",
  context: {
    hadError: false,
    verificationResult: null,
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
              type: "isVerified",
              params: ({ event }) => event.output,
            },
            actions: {
              type: "setVerificationResult",
              params: ({ event }) => ({ result: event.output }),
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
