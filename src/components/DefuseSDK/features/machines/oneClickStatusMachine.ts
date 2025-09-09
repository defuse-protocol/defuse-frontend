import type { ActorRef, Snapshot } from "xstate"
import { assign, fromPromise, not, setup } from "xstate"
import { logger } from "../../logger"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../types/base"
import { getTxStatus } from "./1cs"

type ChildEvent = {
  type: "ONE_CLICK_SETTLED"
  data: {
    depositAddress: string
    status: string
    tokenIn: BaseTokenInfo | UnifiedTokenInfo
    tokenOut: BaseTokenInfo | UnifiedTokenInfo
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

export const oneClickStatusMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      depositAddress: string
      tokenIn: BaseTokenInfo | UnifiedTokenInfo
      tokenOut: BaseTokenInfo | UnifiedTokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      totalAmountOut: { amount: bigint; decimals: number }
    },
    context: {} as {
      parentRef: ParentActor
      depositAddress: string
      tokenIn: BaseTokenInfo | UnifiedTokenInfo
      tokenOut: BaseTokenInfo | UnifiedTokenInfo
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
    pollInterval: 3000, // 3 seconds
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsB2YDCAbAlgYwGsBlAFwEMSBXWAOgAcxUIdUoBiAbQAYBdRUOslg4SONPxAAPRABYAnHJoAOAMwBWOQEYVKgEwB2fbq4yANCACeiY7pq61XR100A2OVw2alAX2-m0mLiEpBTUNHgAFmCELOwQATQsAG7IBGA0Adj4xORUtJHRBLEIych4FGKo3DzVEoLCouJIUrIKyupaOgZGJuZWCLryNPryCvqackq6E4a+-uhZwblhBTGsbGAATpvIm-RYFABmuwC2GQtBOaH5UWtQJagp5Y1VvLXN9SKVEtIIctN2UZuGQyNT6FSqPrWFy2OT6FxqNRTTTyGQwmRzECZS4hPI0ADuZC+63eAiEXyaoF+mn0ShoCjGuncLk03ShCBk+kULi5bmcmhRKk0YMx2OyuLChOJ7A4mj4H3JLx+iBpdIZcKZXBZbMssgm9KZbmMChhE1FF3Fy1ogiwuHWklguXSZEOJC2AAobVgAJKoN2bJJkLAASjYYqW13oyFtsVJIE+Suav1G7U8XUMxjMuo5+ppcmBKhkUw1KnNgUtka2O02bAASgBRAAqtYAmnGE98kyrHPoDfmeaoQeylJoaKMGSPxkW9L4-CBUMgIHAJOGrnk6orO1TEABaFzsvdlxZrsIMJixDcNLctBAqIypuQyEzTDQGYe9pE6O-yLjM39HnErXCW4ilYS8KVQZUEDcRQ1CFaZVA0JRQV0dkDBkMdDWQotJhRfQAIrPEpVEMCFSvSkbxkVDsxULUaFotEplUJklEfAiIzxL0LzIiCoPUXsdE8VRwRhFl2RkLwaDzFwlBZeFdCUNQZFLOdVwlWhYEoPA8DgeAeMTbdbwk1NWJcPQ1AROQ1HE+EaB5fMFCUx83BcdiT1oKtdnAgybwFfUXF-QsuCUZCdB5dl3BoYKdFBOQ7zw2ZZyAA */
  id: "oneClickStatus",
  initial: "pending",
  context: ({ input }) => ({
    parentRef: input.parentRef,
    depositAddress: input.depositAddress,
    tokenIn: input.tokenIn,
    tokenOut: input.tokenOut,
    totalAmountIn: input.totalAmountIn,
    totalAmountOut: input.totalAmountOut,
    status: null,
    error: null,
  }),
  states: {
    pending: {
      always: "checking",
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

export const oneClickStatuses = {
  KNOWN_DEPOSIT_TX: "Known Deposit Tx",
  PROCESSING: "Processing",
  SUCCESS: "Success",
  REFUNDED: "Refunded",
  FAILED: "Failed",
  PENDING_DEPOSIT: "Pending Deposit",
  INCOMPLETE_DEPOSIT: "Incomplete Deposit",
}

export const statusesToTrack = new Set([
  "KNOWN_DEPOSIT_TX",
  "PENDING_DEPOSIT",
  "INCOMPLETE_DEPOSIT",
  "PROCESSING",
  "FAILED_EXECUTION",
])
