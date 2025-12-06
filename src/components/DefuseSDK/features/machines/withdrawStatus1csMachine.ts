import { solverRelay } from "@defuse-protocol/internal-utils"
import { GetExecutionStatusResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { logger } from "@src/utils/logger"
import { type ActorRef, type Snapshot, log } from "xstate"
import { assign, fromPromise, not, setup } from "xstate"
import type { TokenInfo } from "../../types/base"
import { getTxStatus, submitTxHash } from "./1cs"
import type { WithdrawIntentDescription } from "./withdrawIntent1csMachine"

type ChildEvent = {
  type: "WITHDRAW_1CS_SETTLED"
  data: {
    depositAddress: string
    status: GetExecutionStatusResponse.status
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    recipient: string
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

export const withdrawStatus1csMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      intentHash: string
      depositAddress: string
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      totalAmountOut: { amount: bigint; decimals: number }
      intentDescription: WithdrawIntentDescription
    },
    context: {} as {
      parentRef: ParentActor
      intentHash: string
      depositAddress: string
      txHash: string | null
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      totalAmountOut: { amount: bigint; decimals: number }
      intentDescription: WithdrawIntentDescription
      status: GetExecutionStatusResponse.status | null
      error: Error | null
    },
  },
  actions: {
    logError: (_, params: { error: unknown }) => {
      logger.error(params.error)
    },
    setTxHash: assign({
      txHash: (_, txHash: string) => txHash,
    }),
    setStatus: assign({
      status: (_, status: GetExecutionStatusResponse.status) => status,
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
          type: "WITHDRAW_1CS_SETTLED",
          data: {
            depositAddress: context.depositAddress,
            status: context.status,
            tokenIn: context.tokenIn,
            tokenOut: context.tokenOut,
            recipient: context.intentDescription.recipient,
          },
        })
      }
    },
  },
  actors: {
    waitIntentTxHash: fromPromise(
      ({
        input,
        signal,
      }: {
        input: { intentHash: string }
        signal: AbortSignal
      }): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
          return solverRelay
            .waitForIntentSettlement({
              signal,
              intentHash: input.intentHash,
              retryOptions: {
                delay: 100,
                maxAttempts: 50,
              },
              onTxHashKnown: (txHash) => {
                resolve(txHash)
              },
            })
            .then((result) => {
              // Fallback in case `onTxHashKnown` is not called (but it should never happen)
              resolve(result.txHash)
            }, reject)
        })
      }
    ),
    submitTxHashActor: fromPromise(
      async ({
        input,
      }: {
        input: { depositAddress: string; txHash: string }
      }) => {
        return submitTxHash({
          depositAddress: input.depositAddress,
          txHash: input.txHash,
        })
      }
    ),
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
  id: "withdrawStatus1cs",
  initial: "pending",
  context: ({ input }) => ({
    parentRef: input.parentRef,
    intentHash: input.intentHash,
    depositAddress: input.depositAddress,
    txHash: null,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    totalAmountIn: input.totalAmountIn,
    totalAmountOut: input.totalAmountOut,
    intentDescription: input.intentDescription,
    status: null,
    error: null,
  }),
  states: {
    pending: {
      always: "intent_settling",
    },
    intent_settling: {
      invoke: {
        src: "waitIntentTxHash",
        input: ({ context }) => ({ intentHash: context.intentHash }),
        onDone: {
          target: "SubmittingTxHash",
          actions: [
            log("Withdraw intent tx known"),
            { type: "setTxHash", params: ({ event }) => event.output },
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
    SubmittingTxHash: {
      invoke: {
        src: "submitTxHashActor",
        input: ({ context }) => ({
          depositAddress: context.depositAddress,
          txHash: context.txHash ?? "",
        }),
        onDone: {
          target: "checking",
          actions: log("Withdraw intent tx submitted"),
        },
        onError: {
          target: "checking",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
          ],
        },
      },
    },
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
          actions: log("Withdrawal completed"),
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
        RETRY: "pending",
      },
    },
  },
})

const statusesToTrack = new Set<GetExecutionStatusResponse.status>([
  GetExecutionStatusResponse.status.KNOWN_DEPOSIT_TX,
  GetExecutionStatusResponse.status.PENDING_DEPOSIT,
  GetExecutionStatusResponse.status.INCOMPLETE_DEPOSIT,
  GetExecutionStatusResponse.status.PROCESSING,
])
