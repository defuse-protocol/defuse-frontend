import type { WithdrawalParams } from "@defuse-protocol/intents-sdk"
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
import { bridgeSDK } from "../../constants/bridgeSdk"
import { logger } from "../../logger"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { submitTxHash } from "./1cs"
import { isOk } from "./1csResult"
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
          withdrawalParams: WithdrawalParams
          sourceTxHash: string
        }
      }) => {
        return bridgeSDK
          .waitForWithdrawalCompletion({
            withdrawalParams: input.withdrawalParams,
            intentTx: {
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
    submitTxHashActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          txHash: string
          depositAddress: string
        }
      }) => {
        try {
          const result = await submitTxHash({
            txHash: input.txHash,
            depositAddress: input.depositAddress,
          })

          if (isOk(result)) {
            return
          }

          logger.error("Failed to submit tx hash to 1CS:", {
            error: result.err,
          })
        } catch (error) {
          logger.error("Failed to submit tx hash to 1CS:", {
            error: error instanceof Error ? error.message : String(error),
          })
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
    isSwapWith1csDepositAddress: ({ context }) => {
      return (
        context.intentDescription.type === "swap" &&
        !!context.intentDescription.depositAddress
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QEsB2AXMGDK6CG6ArrAHQAOWEaUAxANoAMAuoqGQPazLrLuqsgAHogCMANgCcJBjIYiGAdgAsDCUrFKANCACeiJQoUkxqpQA4ArLPUMlAXzva0mHPiKkAxgAswHgNbUNBB8YCRoAG7sfqHOWOi4BMQk3r4BqFAIEeweBLyojEwFAhxcPHwCwghWRhYSAMwKtRYijQBMdSIW2noI7XUkrVYMdQxWLWaGYg5OGHEJ7sk+-oHBqDGokdFhs66JnktpGVk5ZfnMdCIsSCAl3HkViNUktQ1NLRbtnd36hsamGkoJB8JCJWlNHCBYrsFillukaGAAE6I9iI8gAGwIADNUQBbbYueJuJKww6ZDbZXJ8ApFa63U4PKqKZ71RpA96fLq6R6NEh1MytMyAkQSZRCurTSE7Il7EiwMDodDoyD0ZjFTh3crXSryGQkEFKXViKwaZTfXoWMQkBRgkx1ExqQbgmaE+ZJeWK5UQeiXdWle7a0SyfUiQ0yY0MU1abkIMwiZ6yVT8sStEFqSVQmULD1KlV0VpXNgahmBhC6hghsORk0GaM9JRKVrGOqCxpmO0CiwZ6Vu0iwQgAI1x3B46QAKoIABJ4WBeIIhbabdau4l9wfDxXUCfT2fkyInPI0tV04sB0A6iz2-UKMQp2ptsSWc2tPWJ1rmdSW9pmbsr2X9ocRy3KcZznJEUTRMhMXQHFEXxTNezldcgPHEDd2OKkzkKY8i39LVz1ES8rVFW9BlFCx2yfGN3xqWRU35MwgRtVpfzmVcSAAdzwO50gAMVRAAhRFkGgMB5zWRcomXNjZS4nioH4xEhJEmA90pU4j0LG5T3woRCKvEi73IyiuR6OoVBIJRL3ECxmgbOoLAUVjoSSOTRwUwThNEhFkVRDFsTxAkZIWNzqEU5TRLUg9qXOHDtLw-hS06AybyMh8qPrOp+hUMQRnEOoJANFiIQQ9jwNRGgACUAFEx0qgBNWlcM1RKCLLW8lEsiR2lvdsxBtc0FH5Z520jSNurMLKJAcCFUHYCA4AEUq9j9FrGQAWjEc1NukRM9sTJySp7diKFQKh0lWks2sbQasoTVohrMOMwQUIVnKzEkDmoS6zz03oNGkSw1GGQrDXfc0rP6eQ1AK8zmNvd7EJzL0ft0ypKOMDQGCFEQGlaGjnwsTqSNqEVceYhhipdYL3WQzdUJ3LxUdav7QSFfVHzjCRcoekEtuojpLNSuQJGGORLER9jQr4zyVLAZnGTZ4nOZFHmFD5iGWj5AUJkNS9yPsI6-2zQgPA8OB4BPBLFfVq0WhFONbMvV6RHNEYpGBZR+sBAqhsl2U5vQAB9cI8HRESFdLIUmwNSNHxFW3XZjAwLD5WoU7Bd9OmUf2FnKxFI7alpuZIe2JEd2yGjjQawQ5+R8scpNDYcIA */
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
          target: "submittingTxHash",
          guard: "isSwapWith1csDepositAddress",
        },
        {
          target: "success",
          guard: not("isWithdraw"),
        },
        {
          target: "waitingForBridge",
        },
      ],
    },
    submittingTxHash: {
      invoke: {
        src: "submitTxHashActor",
        input: ({ context }) => {
          assert(context.txHash != null, "txHash is null")
          assert(
            context.intentDescription.type === "swap" &&
              context.intentDescription.depositAddress != null,
            "depositAddress is null for swap intent"
          )

          return {
            txHash: context.txHash,
            depositAddress: context.intentDescription.depositAddress,
          }
        },
        onDone: {
          target: "success",
          // Always proceed to success regardless of submitTxHash result
        },
        onError: {
          target: "success",
          // Proceed to success even on error - we don't want to block the user
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },
    },
    waitingForBridge: {
      invoke: {
        src: "waitForBridgeActor",
        input: ({ context }) => {
          assert(context.txHash != null, "txHash is null")
          assert(context.intentDescription.type === "withdraw")
          return {
            sourceTxHash: context.txHash,
            withdrawalParams: context.intentDescription.withdrawalParams,
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
