import { logger } from "@src/utils/logger"
import { type ActorRef, type Snapshot, log } from "xstate"
import { assign, fromPromise, not, setup } from "xstate"
import type { TokenInfo } from "../../types/base"
import { getTxStatus } from "./1cs"

type ChildEvent = {
  type: "ONE_CLICK_SETTLED"
  data: {
    depositAddress: string
    status: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

export const oneClickStatusMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      intentHash: string
      depositAddress: string
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      totalAmountOut: { amount: bigint; decimals: number }
    },
    context: {} as {
      parentRef: ParentActor
      intentHash: string
      depositAddress: string
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      totalAmountOut: { amount: bigint; decimals: number }
      status: string | null
      error: Error | null
    },
  },
  actions: {
    logError: (_, params: { error: unknown }) => {
      logger.error(params.error)
    },
    setStatus: assign({
      status: (_, status: string) => status,
    }),
    setError: assign({
      error: (_, error: Error) => error,
    }),
    clearError: assign({
      error: null,
    }),
    notifyParent: ({ context }) => {
      if (context.status && !statusesToTrack.has(context.status)) {
        context.parentRef.send({
          type: "ONE_CLICK_SETTLED",
          data: {
            depositAddress: context.depositAddress,
            status: context.status,
            tokenIn: context.tokenIn,
            tokenOut: context.tokenOut,
          },
        })
      }
    },
  },
  actors: {
    checkTxStatus: fromPromise(
      async ({
        input,
      }: {
        input: { depositAddress: string }
      }) => {
        const result = await getTxStatus(input.depositAddress)
        if ("err" in result) {
          throw new Error(result.err)
        }
        return result.ok.status
      }
    ),
  },
  guards: {
    shouldContinueTracking: ({ context }) => {
      return context.status != null && statusesToTrack.has(context.status)
    },
  },
  delays: {
    pollInterval: 500,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsB2YDCAbAlgYwGsBlAFwEMSBXWAOgAcxUIdUoBiAbQAYBdRUOslg4SONPxAAPRACYArHJoAWABwBmFQHYVAJgBsARm0BOLQBoQAT0QBaLWpoBOfWpNy1Wk7rkA2bQF9fCzRMXEJSCmoaAAswaggIGn4wKJYIADcwAhAAdkJiCmpaWNiMeIRk5DwKMVQAcS1RTWVhUUkZOS9vTV9Xfx8tX01XLUcvd0tzBEGvfRV3PQ95bQNnAYNPf0C0PLCI6NjsKIS2djYBYUlpaQAmkVKpFQrtIc8hlXH-TQm1Zz6tCrqDZacYGFSLeYDAKBdAQhZLFZrLDRHB4PB7djZA4qY5aDT9LRaVR+VwqX4aR5qR5nZzKbrUhJ9AFefTKZ5aIb6dFYHHLPGQTb4PYEK47W5FBQ3dR3IZ9ZxPbrOUGKZyuAVqBxqJ6KeFfJHfTwqV6uHq-DRGWkg0LLMDrGhJJLbeJJOUKI46F5qawuNwTTrqNXgsEUkwOMH6VEqIYW3WgvVeFTKRY0IA */
  id: "oneClickStatus",
  initial: "checking",
  context: ({ input }) => ({
    parentRef: input.parentRef,
    intentHash: input.intentHash,
    depositAddress: input.depositAddress,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    totalAmountIn: input.totalAmountIn,
    totalAmountOut: input.totalAmountOut,
    status: null,
    error: null,
  }),
  states: {
    checking: {
      invoke: {
        src: "checkTxStatus",
        input: ({ context }) => ({ depositAddress: context.depositAddress }),
        onDone: {
          target: "waiting",
          actions: [
            {
              type: "setStatus",
              params: ({ event }) => event.output,
            },
            "clearError",
            "notifyParent",
          ],
        },
        onError: {
          target: "error",
          actions: [
            {
              type: "setError",
              params: ({ event }) => new Error(String(event.error)),
            },
            {
              type: "logError",
              params: ({ event }) => event,
            },
          ],
        },
      },
    },
    waiting: {
      always: [
        {
          target: "success",
          guard: not("shouldContinueTracking"),
          actions: log("Swap completed"),
        },
        {
          target: "polling",
        },
      ],
    },
    polling: {
      after: {
        pollInterval: "checking",
      },
    },
    success: {
      type: "final",
    },
    error: {
      on: {
        RETRY: "checking",
      },
    },
  },
})

export const oneClickStatuses = {
  KNOWN_DEPOSIT_TX: "Known Deposit Tx",
  PROCESSING: "Processing",
  SUCCESS: "Success",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  PENDING_DEPOSIT: "Pending...",
  INCOMPLETE_DEPOSIT: "Incomplete Deposit",
}

export const statusesToTrack = new Set([
  "KNOWN_DEPOSIT_TX",
  "PENDING_DEPOSIT",
  "INCOMPLETE_DEPOSIT",
  "PROCESSING",
  "FAILED_EXECUTION",
])
