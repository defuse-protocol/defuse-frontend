import type { solverRelay } from "@defuse-protocol/internal-utils"
import { solverRelayWaitForSettlement } from "@src/actions/solverRelayProxy"
import { logger } from "@src/utils/logger"
import {
  type ActorRef,
  type Snapshot,
  assign,
  fromPromise,
  not,
  sendTo,
  setup,
} from "xstate"
import type { TokenInfo } from "../../types/base"
import type { IntentDescription } from "../../types/intent"
import { assert } from "../../utils/assert"
import { getTxStatus } from "./1cs"
import { statusesToTrack } from "./oneClickStatusMachine"

type ChildEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

export const intentStatusMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      intentHash: string
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      intentDescription: IntentDescription
    },
    context: {} as {
      parentRef: ParentActor
      intentHash: string
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      txHash: string | null
      intentDescription: IntentDescription
      bridgeTransactionResult: null | { destinationTxHash: string | null }
      bridgeRetryCount: number
    },
  },
  actions: {
    logError: (_, params: { error: unknown }) => {
      logger.error(params.error)
    },
    setSettlementResult: assign({
      txHash: (
        _,
        settlementResult: solverRelay.WaitForIntentSettlementReturnType
      ) => settlementResult.txHash,
    }),
  },
  actors: {
    checkIntentStatus: fromPromise(
      ({
        input,
      }: {
        input: { intentHash: string }
      }): Promise<solverRelay.WaitForIntentSettlementReturnType> =>
        solverRelayWaitForSettlement({
          intentHash: input.intentHash,
        })
    ),
    waitForOneClickWithdrawalActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          depositAddress: string
        }
      }) => {
        for (;;) {
          const result = await getTxStatus(input.depositAddress)
          if ("err" in result) {
            throw new Error(result.err)
          }

          if (!statusesToTrack.has(result.ok.status)) {
            return result.ok.status
          }

          await new Promise((resolve) => setTimeout(resolve, 2000))
        }
      }
    ),
  },
  guards: {
    isSettled: (
      _,
      settlementResult: solverRelay.WaitForIntentSettlementReturnType
    ) => !!settlementResult.txHash,
    isWithdraw: ({ context }) => {
      return context.intentDescription.type === "withdraw"
    },
    isOneClickWithdrawal: ({ context }) => {
      return (
        context.intentDescription.type === "withdraw" &&
        "depositAddress" in context.intentDescription
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEsB2AXMGDK6CG6ArrAHQAOWEaUAxANoAMAuoqGQPazLrLuqsgAHogCMAFgBsJCQCYZDGQFYGigMwiJAdgCcEgDQgAnqIbaSikQ01WJFzQA5tMiQF8XBtJhz4ipAMYAFmB+ANbUNBB8YCRoAG7sIdGeWOi4BMQkgcFhqFAIcex+BLyojExlAhxcPHwCwgiKMvYk9oqKYqqOipoiMmIiBsYI9iIkqnLa4lr2qroybh4YKWm+mUGh4ZGoSajxiTFL3un+6zl5BUU1pcx0IixIIFXcJXWIjaMy6gwikx3WmoNRLoxt11DpGvYmmJ5u4QMkjqsshtcjQwAAnNHsNHkAA2BAAZliALYHLypHwZJFnfK7QrFPhlCoPJ5XV4IGSTEgMMHfEQ9bTctSA9nOEiaSSNVSKCQSSQSESKBZww7k44kdGYtE0ABKAFEACragCaTLYnGetQe9TEimkYgF9hmMk06jaimFqjEzU0zu6KgYDC9srcsNQ7AgcAE8NVvkq5tZVsQAFomiQnNzZo7OpoZbZhUnmo1nfYFPYOmIbfaldGVhkKKgqLk49UXomED8uToZbz5Z9VFLhZYZCQZOJIZ6bdMbdWVbWTtlqM2Lfw286pMpVD1VAwZpDdMKHC0A71xAwJLodNoZ2S5yRYIQ-H44PBmfHW6B6toRiQvWIrNpNxLBV9CMEwGDTCQSzLJx+ilL1r2WClSDDdAAH1YjwHFkAgJcEw-RBtB0H9pX9ewdHsWwxEHACR00Bw6P6SES0UewEIRDINSxXD3yERApVUcwVBlaFRw5ERPQ9L0xm0NpxE9TMfhDFwgA */
  id: "intentStatus",
  initial: "pending",
  context: ({ input }) => {
    return {
      parentRef: input.parentRef,
      intentHash: input.intentHash,
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      txHash: null,
      intentDescription: input.intentDescription,
      bridgeTransactionResult: null,
      bridgeRetryCount: 0,
    }
  },
  states: {
    pending: {
      always: "checking",
    },
    checking: {
      invoke: {
        src: "checkIntentStatus",
        input: ({ context }) => ({ intentHash: context.intentHash }),
        onDone: [
          {
            target: "settled",
            guard: {
              type: "isSettled",
              params: ({ event }) => event.output,
            },
            actions: {
              type: "setSettlementResult",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "not_valid",
            reenter: true,
          },
        ],
        onError: {
          target: "error",
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },
    },
    settled: {
      always: [
        {
          target: "success",
          guard: not("isWithdraw"),
        },
        {
          target: "waitingForOneClickWithdrawal",
          guard: "isOneClickWithdrawal",
        },
        {
          target: "error",
        },
      ],
    },
    waitingForOneClickWithdrawal: {
      invoke: {
        src: "waitForOneClickWithdrawalActor",
        input: ({ context }) => {
          assert(context.intentDescription.type === "withdraw")
          assert(
            "depositAddress" in context.intentDescription,
            "depositAddress missing"
          )
          return {
            depositAddress: context.intentDescription.depositAddress,
          }
        },
        onDone: {
          target: "success",
        },
        onError: {
          target: "error",
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },
    },
    success: {
      type: "final",

      entry: sendTo(
        ({ context }) => context.parentRef,
        ({ context }) => {
          assert(context.txHash != null, "txHash is null")
          return {
            type: "INTENT_SETTLED" as const,
            data: {
              intentHash: context.intentHash,
              txHash: context.txHash,
              tokenIn: context.tokenIn,
              tokenOut: context.tokenOut,
            },
          }
        }
      ),
    },
    not_valid: {
      type: "final",
    },
    error: {
      on: {
        RETRY: "pending",
      },
    },
  },
})
