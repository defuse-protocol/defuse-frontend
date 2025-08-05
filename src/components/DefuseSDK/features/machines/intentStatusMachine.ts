import {
  type RouteConfig,
  createNearWithdrawalRoute,
  createVirtualChainRoute,
} from "@defuse-protocol/bridge-sdk"
import { solverRelay } from "@defuse-protocol/internal-utils"
import {
  type ActorRef,
  type Snapshot,
  assign,
  fromPromise,
  not,
  sendTo,
  setup,
} from "xstate"
import { getAuroraEngineContractId } from "../../constants/aurora"
import { bridgeSDK } from "../../constants/bridgeSdk"
import { logger } from "../../logger"
import type {
  BaseTokenInfo,
  SupportedBridge,
  SupportedChainName,
  UnifiedTokenInfo,
} from "../../types/base"
import type { IntentsUserId } from "../../types/intentsUserId"
import { assert } from "../../utils/assert"
import { getCAIP2 } from "../../utils/caip2"
import type { IntentDescription } from "./swapIntentMachine"

type ChildEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: BaseTokenInfo | UnifiedTokenInfo
    tokenOut: BaseTokenInfo | UnifiedTokenInfo
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ChildEvent>

export const intentStatusMachine = setup({
  types: {
    input: {} as {
      parentRef: ParentActor
      intentHash: string
      tokenIn: BaseTokenInfo | UnifiedTokenInfo
      tokenOut: BaseTokenInfo | UnifiedTokenInfo
      intentDescription: IntentDescription
    },
    context: {} as {
      parentRef: ParentActor
      intentHash: string
      tokenIn: BaseTokenInfo | UnifiedTokenInfo
      tokenOut: BaseTokenInfo | UnifiedTokenInfo
      txHash: string | null
      intentDescription: IntentDescription
      bridgeTransactionResult: null | { destinationTxHash: string | null }
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
    setBridgeTransactionResult: assign({
      bridgeTransactionResult: (
        _,
        v: null | { destinationTxHash: string | null }
      ) => v,
    }),
  },
  actors: {
    checkIntentStatus: fromPromise(
      ({
        input,
        signal,
      }: {
        input: { intentHash: string }
        signal: AbortSignal
      }): Promise<solverRelay.WaitForIntentSettlementReturnType> =>
        solverRelay.waitForIntentSettlement({
          signal,
          intentHash: input.intentHash,
        })
    ),
    waitForBridgeActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          sourceTxHash: string
          bridge: SupportedBridge
          accountId: IntentsUserId
          chainName: SupportedChainName
          recipient: string
          nearIntentsNetwork: boolean
        }
      }) => {
        return bridgeSDK
          .waitForWithdrawalCompletion({
            routeConfig: toRouteConfig(
              input.nearIntentsNetwork ? "direct" : input.bridge,
              input.chainName
            ),
            index: 0,
            tx: {
              hash: input.sourceTxHash,
              accountId: "intents.near", // our relayer sends txs on behalf of "intents.near"
            },
          })
          .then((result) => {
            return {
              destinationTxHash: result.hash,
            }
          })
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
          target: "waitingForBridge",
        },
      ],
    },
    waitingForBridge: {
      invoke: {
        src: "waitForBridgeActor",
        input: ({ context }) => {
          assert(context.txHash != null, "txHash is null")
          assert(context.intentDescription.type === "withdraw")
          return {
            bridge: context.intentDescription.tokenOut.bridge,
            sourceTxHash: context.txHash,
            accountId: context.intentDescription.accountId,
            chainName: context.intentDescription.chainName,
            recipient: context.intentDescription.recipient,
            nearIntentsNetwork: context.intentDescription.nearIntentsNetwork,
          }
        },

        onError: {
          target: "error",
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },

        onDone: {
          target: "success",
          actions: {
            type: "setBridgeTransactionResult",
            params: ({ event }) => event.output,
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

function toRouteConfig(
  bridge: SupportedBridge,
  chainName: SupportedChainName
): RouteConfig {
  switch (bridge) {
    case "aurora_engine": {
      return createVirtualChainRoute(
        getAuroraEngineContractId(chainName),
        null // TODO: provide the correct value once you know it
      )
    }
    case "hot_omni":
      return {
        route: "hot_bridge",
        chain: getCAIP2(chainName),
      }
    case "poa":
      return {
        route: "poa_bridge",
        chain: getCAIP2(chainName),
      }
    case "direct":
      return createNearWithdrawalRoute()
    default:
      bridge satisfies never
      throw new Error(`Unsupported bridge: ${bridge}`)
  }
}
