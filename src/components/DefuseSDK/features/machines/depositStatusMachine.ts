import { logger } from "@src/utils/logger"
import { type ActorRef, type Snapshot, log } from "xstate"
import { assign, fromPromise, not, setup } from "xstate"
import type { SupportedChainName, TokenInfo } from "../../types/base"
import { statusesToTrack } from "../../utils/getStatusDisplayInfo"
import { getTxStatus, submitTxHash } from "./1cs"

export type DepositSettledEvent = {
  type: "DEPOSIT_SETTLED"
  data: {
    depositAddress: string
    status: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, DepositSettledEvent>

export const depositStatusMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      userAddress: string
      depositAddress: string
      txHash: string | null
      memo: string | null
      tokenIn: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      is1cs: boolean
      blockchain: SupportedChainName
    },
    context: {} as {
      parentRef: ParentActor
      userAddress: string
      depositAddress: string
      txHash: string | null
      memo: string | null
      tokenIn: TokenInfo
      totalAmountIn: { amount: bigint; decimals: number }
      is1cs: boolean
      blockchain: SupportedChainName
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
          type: "DEPOSIT_SETTLED",
          data: {
            depositAddress: context.depositAddress,
            status: context.status,
            tokenIn: context.tokenIn,
            tokenOut: context.tokenIn, // Using tokenIn as tokenOut for now
          },
        })
      }
    },
  },
  actors: {
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
    is1Click: ({ context }) => context.is1cs,
  },
  delays: {
    pollInterval: 500, // 0.5 second
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHsB2YDCAbAlgYwGsBlAFwEMSBXWAOgAcxUIdUoBiAbQAYBdRUOslg4SONPxAAPRABYAnHJoAOAMwBWOQEYVKgEwB2fbq4yANCACeiY7pq61XR100A2OVw2alAX2-m0mLiEpBTUNHgAFmCELOwQATQsAG7IBGA0Adj4xORUtJHRBLEIych4FGKo3DzVEoLCouJIUrIKyupaOgZGJuZWCLryNPryCvqackq6E4a+-uhZwblhBTGsbGAATpvIm-RYFABmuwC2GQtBOaH5UWtQJagp5Y1VvLXN9SKVEtIIctN2UZuGQyNT6FSqPrWFy2OT6FxqNRTTTyGQwmRzECZS4hPI0ADuZC+63eAiEXyaoF+mn0ShoCjGuncLk03ShCBk+kULi5bmcmhRKk0YMx2OyuLChOJ7A4mj4H3JLx+iBpdIZcKZXBZbMssgm9KZbmMChhE1FF3Fy1ogiwuHWklguXSZEOJC2AAobVgAJKoN2bJJkLAASjYYqW13oyFtsVJIE+Suav1G7U8XUMxjMuo5+ppcmBKhkUw1KnNgUtka2O02bAASgBRAAqtYAmnGE98kyrHPoDfmeaoQeylJoaKMGSPxkW9L4-CBUMgIHAJOGrnk6orO1TEABaFzsvdlxZrsIMJixDcNLctBAqIypuQyEzTDQGYe9pE6O-yLjM39HnErXCW4ilYS8KVQZUEDcRQ1CFaZVA0JRQV0dkDBkMdDWQotJhRfQAIrPEpVEMCFSvSkbxkVDsxULUaFotEplUJklEfAiIzxL0LzIiCoPUXsdE8VRwRhFl2RkLwaDzFwlBZeFdCUNQZFLOdVwlWhYEoPA8DgeAeMTbdbwk1NWJcPQ1AROQ1HE+EaB5fMFCUx83BcdiT1oKtdnAgybwFfUXF-QsuCUZCdB5dl3BoYKdFBOQ7zw2ZZyAA */
  id: "depositStatus",
  initial: "pending",
  context: ({ input }) => ({
    parentRef: input.parentRef,
    userAddress: input.userAddress,
    depositAddress: input.depositAddress,
    txHash: input.txHash,
    memo: input.memo,
    tokenIn: input.tokenIn,
    totalAmountIn: input.totalAmountIn,
    is1cs: input.is1cs,
    blockchain: input.blockchain,
    status: null,
    error: null,
  }),
  states: {
    pending: {
      always: [
        {
          target: "SubmittingTxHash",
          guard: "is1Click",
        },
        {
          target: "success",
        },
      ],
    },
    SubmittingTxHash: {
      invoke: {
        src: "submitTxHashActor",
        input: ({ context }) => ({
          depositAddress: context.depositAddress,
          txHash: context.txHash ?? "", // don't care if we submit bullshit
        }),
        onDone: {
          target: "checking",
          actions: log("Intent tx submitted"),
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
          actions: log("Deposit completed"),
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
