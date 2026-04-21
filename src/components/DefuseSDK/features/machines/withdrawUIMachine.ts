import { authIdentity } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import type { FeeRecipientSplit } from "@src/utils/getAppFeeRecipient"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import {
  type ActorRefFrom,
  type InputFrom,
  assign,
  emit,
  sendTo,
  setup,
} from "xstate"
import { settings } from "../../constants/settings"
import { emitEvent } from "../../services/emitter"
import type { BaseTokenInfo, TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { isAuroraVirtualChain } from "../../utils/blockchain"
import { isNearIntentsNetwork } from "../withdraw/components/WithdrawForm/utils"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import { intentStatusMachine } from "./intentStatusMachine"
import {
  poaBridgeInfoActor,
  waitPOABridgeInfoActor,
} from "./poaBridgeInfoActor"
import {
  type PreparationOutput,
  prepareWithdrawActor,
} from "./prepareWithdrawActor"
import {
  type Output as Withdraw1csMachineOutput,
  withdraw1csMachine,
} from "./withdraw1csMachine"
import {
  type Events as WithdrawFormEvents,
  type ParentEvents as WithdrawFormParentEvents,
  withdrawFormReducer,
} from "./withdrawFormReducer"

export type Context = {
  error: Error | null
  intentCreationResult: Withdraw1csMachineOutput | null
  intentRefs: ActorRefFrom<typeof intentStatusMachine>[]
  tokenList: TokenInfo[]
  depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  withdrawFormRef: ActorRefFrom<typeof withdrawFormReducer>
  poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  submitDeps: {
    userAddress: string
    userChainType: AuthMethod
    nearClient: providers.Provider
  } | null
  preparationOutput: PreparationOutput | null
  referral?: string
  userAddress: string | null
  appFeeRecipients: FeeRecipientSplit[]
}

type PassthroughEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
  }
}

type EmittedEvents = PassthroughEvent | { type: "INTENT_PUBLISHED" }

export const withdrawUIMachine = setup({
  types: {
    input: {} as {
      tokenIn: TokenInfo
      tokenOut: BaseTokenInfo
      tokenList: TokenInfo[]
      referral?: string
      appFeeRecipients: FeeRecipientSplit[]
    },
    context: {} as Context,
    events: {} as
      | {
          type: "submit"
          params: NonNullable<Context["submitDeps"]>
        }
      | {
          type: "BALANCE_CHANGED"
          params: {
            changedBalanceMapping: BalanceMapping
          }
        }
      | {
          type: "EXECUTION_QUOTE_READY"
          params: {
            newAmountIn: { amount: bigint; decimals: number }
            newOppositeAmount: { amount: bigint; decimals: number }
            previousOppositeAmount: { amount: bigint; decimals: number }
          }
        }
      | DepositedBalanceEvents
      | WithdrawFormEvents
      | WithdrawFormParentEvents
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      withdrawRef: "withdraw1csActor"
    },
  },
  actors: {
    // biome-ignore lint/suspicious/noExplicitAny: bypass xstate+ts bloating; be careful when interacting with `depositedBalanceActor` string
    depositedBalanceActor: depositedBalanceMachine as any,
    withdraw1csActor: withdraw1csMachine,
    intentStatusActor: intentStatusMachine,
    withdrawFormActor: withdrawFormReducer,
    poaBridgeInfoActor: poaBridgeInfoActor,
    waitPOABridgeInfoActor: waitPOABridgeInfoActor,
    prepareWithdrawActor: prepareWithdrawActor,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },

    setUserAddress: assign({
      userAddress: (_, value: Context["userAddress"]) => value,
    }),
    clearUserAddress: assign({
      userAddress: null,
    }),
    setIntentCreationResult: assign({
      intentCreationResult: (_, value: Withdraw1csMachineOutput) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),

    passthroughEvent: emit((_, event: PassthroughEvent) => event),

    setSubmitDeps: assign({
      submitDeps: (_, value: Context["submitDeps"]) => value,
    }),
    setPreparationOutput: assign({
      preparationOutput: (_, val: Context["preparationOutput"]) => val,
    }),
    clearPreparationOutput: assign({
      preparationOutput: null,
    }),
    emitWithdrawalInitiated: ({ context }) => {
      const withdrawContext = context.withdrawFormRef.getSnapshot().context
      const { preparationOutput } = context

      const fee_estimate =
        preparationOutput != null && preparationOutput.tag === "ok"
          ? preparationOutput.value.feeEstimation.amount
          : null

      emitEvent("withdrawal_initiated", {
        token: withdrawContext.tokenIn.symbol,
        amount: withdrawContext.parsedAmount,
        to_chain: withdrawContext.tokenOut.defuseAssetId,
        address_entered: withdrawContext.recipient,
        fee_estimate,
      })
    },

    relayToDepositedBalanceRef: sendTo(
      "depositedBalanceRef",
      (_, event: DepositedBalanceEvents) => event
    ),
    sendToDepositedBalanceRefRefresh: sendTo("depositedBalanceRef", (_) => ({
      type: "REQUEST_BALANCE_REFRESH",
    })),

    emitWithdrawalConfirmed: (
      { context },
      output: Withdraw1csMachineOutput
    ) => {
      if (output.tag !== "ok") return

      const { preparationOutput, submitDeps } = context

      assert(submitDeps != null)

      if (preparationOutput?.tag === "ok") {
        emitEvent("withdrawal_confirmed", {
          tx_hash: output.value.intentHash,
          received_amount: preparationOutput.value.receivedAmount,
          actual_fee: preparationOutput.value.feeEstimation.amount,
          destination_chain: submitDeps.userChainType,
        })
      }
    },

    relayToWithdrawFormRef: sendTo(
      "withdrawFormRef",
      (_, event: WithdrawFormEvents) => event
    ),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

    fetchPOABridgeInfo: sendTo("poaBridgeInfoRef", { type: "FETCH" }),

    sendToWithdrawRefConfirm: sendTo("withdrawRef", () => ({
      type: "CONFIRMED",
    })),

    spawnIntentStatusActor: assign({
      intentRefs: (
        { context, spawn, self },
        output: Withdraw1csMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

        const formValues = context.withdrawFormRef.getSnapshot().context
        const ref = spawn("intentStatusActor", {
          input: {
            parentRef: self,
            intentHash: output.value.intentHash,
            tokenIn: formValues.tokenIn,
            tokenOut: formValues.tokenOut,
            intentDescription: output.value.intentDescription,
          },
        })
        return [...context.intentRefs, ref]
      },
    }),
  },
  guards: {
    isTrue: (_, value: boolean) => value,
    isFalse: (_, value: boolean) => !value,

    isWithdrawParamsComplete: ({ context }) => {
      const formContext = context.withdrawFormRef.getSnapshot().context
      return (
        formContext.parsedAmount != null &&
        formContext.parsedRecipient != null &&
        formContext.cexFundsLooseConfirmation !== "not_confirmed"
      )
    },

    isPreparationOk: ({ context }) => {
      return context.preparationOutput?.tag === "ok"
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",
  },
}).createMachine({
  id: "withdraw-ui",

  context: ({ input, spawn, self }) => ({
    error: null,
    quote: null,
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
    withdrawalSpec: null,
    userAddress: null,
    depositedBalanceRef: spawn("depositedBalanceActor", {
      id: "depositedBalanceRef",
      input: {
        parentRef: self,
        tokenList: input.tokenList,
      } satisfies InputFrom<typeof depositedBalanceMachine>,
    }),
    withdrawFormRef: spawn("withdrawFormActor", {
      id: "withdrawFormRef",
      input: { parentRef: self, tokenIn: input.tokenIn },
    }),
    poaBridgeInfoRef: spawn("poaBridgeInfoActor", {
      id: "poaBridgeInfoRef",
    }),
    submitDeps: null,
    nep141StorageOutput: null,
    nep141StorageQuote: null,
    preparationOutput: null,
    referral: input.referral,
    appFeeRecipients: input.appFeeRecipients,
  }),

  entry: ["fetchPOABridgeInfo"],

  on: {
    INTENT_SETTLED: {
      actions: [
        {
          type: "passthroughEvent",
          params: ({ event }) => event,
        },
        "sendToDepositedBalanceRefRefresh",
      ],
    },

    LOGIN: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        {
          type: "setUserAddress",
          params: ({ event }) => event.params.userAddress,
        },
      ],
    },

    LOGOUT: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        {
          type: "clearUserAddress",
        },
      ],
    },
  },

  states: {
    editing: {
      initial: "idle",

      on: {
        "WITHDRAW_FORM.*": {
          target: "editing",
          actions: [
            {
              type: "relayToWithdrawFormRef",
              params: ({ event }) => event,
            },
          ],
        },

        BALANCE_CHANGED: [".reset_previous_preparation"],

        WITHDRAW_FORM_FIELDS_CHANGED: ".reset_previous_preparation",

        submit: {
          target: ".done",
          guard: "isPreparationOk",
          actions: [
            "clearIntentCreationResult",
            { type: "setSubmitDeps", params: ({ event }) => event.params },
          ],
        },
      },

      states: {
        idle: {
          after: {
            10000: {
              guard: "isPreparationOk",
              target: "preparation",
            },
          },
        },

        reset_previous_preparation: {
          always: [
            {
              target: "preparation",
              guard: "isWithdrawParamsComplete",
              actions: ["clearPreparationOutput"],
            },
            {
              target: "idle",
            },
          ],

          entry: ["clearPreparationOutput"],
        },

        preparation: {
          invoke: {
            src: "prepareWithdrawActor",
            input: ({ context }) => {
              return {
                formValues: context.withdrawFormRef.getSnapshot().context,
                depositedBalanceRef: context.depositedBalanceRef,
                poaBridgeInfoRef: context.poaBridgeInfoRef,
                appFeeRecipients: context.appFeeRecipients,
              }
            },
            onDone: {
              target: "idle",
              actions: {
                type: "setPreparationOutput",
                params: ({ event }) => event.output,
              },
            },
            onError: {
              target: "idle",
              actions: {
                type: "logError",
                params: ({ event }) => event,
              },
            },
          },
        },

        done: {
          type: "final",
        },
      },

      onDone: {
        target: "submitting",
        actions: ["emitWithdrawalInitiated"],
      },
    },

    submitting: {
      invoke: {
        id: "withdrawRef",
        src: "withdraw1csActor",

        input: ({ context, self }) => {
          assert(context.submitDeps, "submitDeps is null")

          const formValues = context.withdrawFormRef.getSnapshot().context
          const recipient = formValues.parsedRecipient
          assert(recipient, "recipient is null")
          assert(formValues.parsedAmount != null, "parsedAmount is null")

          const isIntents = isNearIntentsNetwork(formValues.blockchain)

          return {
            tokenIn: formValues.tokenIn as BaseTokenInfo,
            tokenOut: formValues.tokenOut,
            tokenOutDeployment: formValues.tokenOutDeployment,
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageBasisPoints: 0,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.submitDeps.userAddress,
              context.submitDeps.userChainType
            ),
            deadline: new Date(
              Date.now() + settings.swapExpirySec * 1000
            ).toISOString(),
            userAddress: context.submitDeps.userAddress,
            userChainType: context.submitDeps.userChainType,
            nearClient: context.submitDeps.nearClient,
            amountIn: formValues.parsedAmount,
            recipient: isIntents
              ? authIdentity.authHandleToIntentsUserId(recipient, "near")
              : recipient,
            recipientType: isIntents
              ? QuoteRequest.recipientType.INTENTS
              : QuoteRequest.recipientType.DESTINATION_CHAIN,
            ...(formValues.parsedDestinationMemo
              ? { destinationMemo: formValues.parsedDestinationMemo }
              : {}),
            ...(isAuroraVirtualChain(formValues.tokenOutDeployment.chainName) &&
            recipient
              ? { virtualChainRecipient: recipient }
              : {}),
            destinationChainName: formValues.tokenOutDeployment.chainName,
            previousOppositeAmount: {
              amount: 0n,
              decimals: formValues.tokenOut.decimals,
            },
            parentRef: self,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },
            actions: [
              {
                type: "emitWithdrawalConfirmed",
                params: ({ event }) => event.output,
              },
              {
                type: "spawnIntentStatusActor",
                params: ({ event }) => event.output,
              },
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
              "emitEventIntentPublished",
            ],
          },
          {
            target: "editing",
            actions: [
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
            ],
          },
        ],

        onError: {
          target: "editing",

          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },

      on: {
        EXECUTION_QUOTE_READY: {
          actions: "sendToWithdrawRefConfirm",
        },
      },
    },
  },

  initial: "editing",
})
