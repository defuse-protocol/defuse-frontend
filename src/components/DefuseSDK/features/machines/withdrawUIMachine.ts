import { authIdentity } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
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
import { emitEvent } from "../../services/emitter"
import type { QuoteResult } from "../../services/quoteService"
import type { BaseTokenInfo, TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { isNearIntentsNetwork } from "../withdraw/components/WithdrawForm/utils"
import type { ParentEvents as BackgroundQuoterParentEvents } from "./backgroundQuoterMachine"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  balancesSelector,
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
  type Output as SwapIntentMachineOutput,
  swapIntentMachine,
} from "./swapIntentMachine"
import {
  type Events as WithdrawFormEvents,
  type ParentEvents as WithdrawFormParentEvents,
  withdrawFormReducer,
} from "./withdrawFormReducer"

export type Context = {
  error: Error | null
  intentCreationResult: SwapIntentMachineOutput | null
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
  appFeeRecipient: string
}

type PassthroughEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: TokenInfo
    /**
     * This is not true, because tokenOut should be `BaseTokenInfo`.
     * It left `TokenInfo` for compatibility with `intentStatusActor`.
     */
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
      appFeeRecipient: string
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
      | BackgroundQuoterParentEvents
      | DepositedBalanceEvents
      | WithdrawFormEvents
      | WithdrawFormParentEvents
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      swapRef: "swapActor"
    },
  },
  actors: {
    // biome-ignore lint/suspicious/noExplicitAny: bypass xstate+ts bloating; be careful when interacting with `depositedBalanceActor` string
    depositedBalanceActor: depositedBalanceMachine as any,
    swapActor: swapIntentMachine,
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
      intentCreationResult: (_, value: SwapIntentMachineOutput) => value,
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

    spawnIntentStatusActor: assign({
      intentRefs: (
        { context, spawn, self },
        output: SwapIntentMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

        const formValues = context.withdrawFormRef.getSnapshot().context

        const intentRef = spawn("intentStatusActor", {
          id: `intent-${output.value.intentHash}`,
          input: {
            parentRef: self,
            intentHash: output.value.intentHash,
            tokenIn: formValues.tokenIn,
            tokenOut: formValues.tokenOut,
            intentDescription: output.value.intentDescription,
          },
        })

        const { preparationOutput, submitDeps } = context

        assert(preparationOutput != null)
        assert(submitDeps != null)

        if (preparationOutput.tag === "ok") {
          emitEvent("withdrawal_confirmed", {
            tx_hash: output.value.intentHash,
            received_amount: preparationOutput.value.receivedAmount,
            actual_fee: preparationOutput.value.feeEstimation.amount,
            destination_chain: submitDeps.userChainType,
          })
        }

        return [intentRef, ...context.intentRefs]
      },
    }),

    relayToWithdrawFormRef: sendTo(
      "withdrawFormRef",
      (_, event: WithdrawFormEvents) => event
    ),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

    fetchPOABridgeInfo: sendTo("poaBridgeInfoRef", { type: "FETCH" }),
  },
  guards: {
    isTrue: (_, value: boolean) => value,
    isFalse: (_, value: boolean) => !value,

    isBalanceSufficientForQuote: (
      _,
      {
        balances,
        quote,
      }: { balances: BalanceMapping; quote: QuoteResult | null }
    ) => {
      // No quote - no need to check balances
      if (quote === null) return true
      if (quote.tag === "err") return true

      for (const [token, amount] of quote.value.tokenDeltas) {
        // We only care about negative amounts, because we are withdrawing
        if (amount >= 0) continue

        // We need to know balances of all tokens involved in the swap
        const balance = balances[token]
        if (balance == null || balance < -amount) {
          return false
        }
      }

      return true
    },

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

    isQuoteOk: (_, quote: QuoteResult) => quote.tag === "ok",

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QHcCWAXAFhATgQ2QFoBXVAYgEkA5AFQFFaB9AZTppoBk6ARAbQAYAuolAAHAPawMqcQDsRIAB6JCAVlUAWAHQAOAOwA2AEwBOEwf4BGfUYA0IAJ4q9ey1oN71rjZaMBmHT8jAF9g+zQsXAIScg4AeQBxagFhJBAJKXQZeTTlBA8tSxMrAwMTP0t+Iw0reycEQhc-LSMjD1V+Pz9VSwMNHVDwjGx8IlIyeIS4gFUaFIUM6TkFPMIjX10NdZ0NPXW9vz665z1m1vbO7t7+wZAIkejSLUhpWSgyCDkwLVh0PHRvvcomNUM8IK8oPM0ossstcogNEEtJ5LAEioj2jpjg0-PwDMiTKiTHoTDodFZWrcgaMYmCIWQAOoUGgACW4ACUAIIMxgAMTi7IAsloAFRQsSSJY5UCrIwuFpbDRlEzVHQGHSabGEAL8LR4vyI3p6LZtIyqKnDYG0l5ZN5kABCnI4nKoAGE6IxXSyXQkeOL0pLYdKlCp1C0-HoNTsDJZXL4tTq9QYDWUjGSKqoQmE7paaU8bag7Y7nW6PV6fX7LKkJZlsitENVkerTFVyjYAn4tf4dIVdoq1ToiuVzdnqY9QQW7VQ6DyAIrTOL0f0wuvwhqqVxaYppirbiw+BPkpMGoydHRmMx9C2RPMT8G295M1kc7l8gWCvkUOgcbjMT3eqhfT4IQFkDVcZRUap8X4fgal8VRm0qfQtUsTN3A8EwNFUfRVEObo-GvB4QTpB8tFQCAABswDIWBiAAIwAWwwZcwLhCCGkjIw9XUGoYN8WCdgTDYyUHdUSSsDRCT0QirXze9CygLQcDgMB0EYURlIANxkYhYHU5TRDwfAgzIFjazYkMGkwrR+xcAxsLTcwDGxHQuLxCxPBg9oTBk28SIUpSVLUjSwG08RdP0sBDOM7JTKrUDzODWVPGRU4qlRPFNDaZzHEQVykxjXE2hqPZPF88d-LeLQQui-5Ys+WRvkLTTxAAa0BXMKsnRSaqMuq5AQZrxAAY362QUjMqV6waYw9F0YxYLxPR+FOVxsSKXVcVjLDI1ccSsyGG8uvkqrepiuQyDAHAcHEHBqoo-4ADNboYrQx2I7rqoMvqg0G2QWtGoMJpA6FWKSlREzNSwlREpV1CxXKEA2rQtuNDd9FjYoNHK4jaMYjAHw+L4yP+trvlgZA8FEdkwEeyag2mixVC3fDim6U81UsLsVvDSoVT4io5QMHHaTxpj0EJhqmtJ9qfkp6nad4eLQcS6bsJMQogn4cl1AsQk7ERwhJMKPiyWhk1oYOnMjtx+jxcJq6bru0QHvQZ6cFeimqZpumQZrKa1z6fFlrEg1EX8LnEdwmz1QjM8XHPFURaeMWCYUshpznBclz9gNVcDtMWlPUkOjVAITC1XY5tMYp+FwmxygI25ZHECA4AUd6YgSgP2MIfQezrzQYIpASNC1ZM5o0PtcUF4kk9HTqPpOqBu4Ztc+9xbih7409+jHw24b1TCPDxMwyUjbGF5t61l7IyiwFX8DLMaVE9VQ2OynwztDdjNxym8YkJJPA8WTneCEgVYCqUimFCKZ0xqPwsqsSw0NCiJ0CMmDc2FVDj20BJawklCS+A1NJK+REb7gLgWvf2VDn5EL1LsBCPhNDWA8HodaMZkSuWKKieypcBikNkmA0iUsEHgw4gaGy+hYKeFxMmA0CZ5QuFjBYX+NhQE-DtmnN4oi1bGhRoSHY21cKwRyvUbUSJ457BVKoFUyDQihCAA */
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
        // `depositedBalanceActor` is any, so we explicitly safeguard it with `satisfies`
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
    appFeeRecipient: input.appFeeRecipient,
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

        BALANCE_CHANGED: [
          {
            guard: {
              type: "isBalanceSufficientForQuote",
              params: ({ context }) => {
                const balances = balancesSelector(
                  context.depositedBalanceRef.getSnapshot()
                )

                if (
                  context.preparationOutput == null ||
                  context.preparationOutput.tag === "err" ||
                  context.preparationOutput.value.swap == null
                ) {
                  return {
                    balances,
                    quote: null,
                  }
                }

                return {
                  balances,
                  quote: context.preparationOutput.value.swap.swapQuote,
                }
              },
            },
          },
          ".reset_previous_preparation",
        ],

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
        id: "swapRef",
        src: "swapActor",

        input: ({ context }) => {
          assert(context.submitDeps, "submitDeps is null")

          assert(
            context.preparationOutput != null &&
              context.preparationOutput.tag === "ok",
            "not prepared"
          )

          const formValues = context.withdrawFormRef.getSnapshot().context
          const recipient = formValues.parsedRecipient
          assert(recipient, "recipient is null")
          const quote =
            context.preparationOutput.value.swap?.swapQuote.tag === "ok"
              ? context.preparationOutput.value.swap?.swapQuote.value
              : null
          return {
            userAddress: context.submitDeps.userAddress,
            userChainType: context.submitDeps.userChainType,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.submitDeps.userAddress,
              context.submitDeps.userChainType
            ),
            referral: context.referral,
            slippageBasisPoints: 0,
            nearClient: context.submitDeps.nearClient,
            intentOperationParams: {
              type: "withdraw",
              tokenOut: formValues.tokenOut,
              tokenOutDeployment: formValues.tokenOutDeployment,
              quote,
              feeEstimation: context.preparationOutput.value.feeEstimation,
              directWithdrawalAmount:
                context.preparationOutput.value.directWithdrawAvailable,
              recipient: recipient,
              destinationMemo: formValues.parsedDestinationMemo,
              prebuiltWithdrawalIntents:
                context.preparationOutput.value.prebuiltWithdrawalIntents,
              withdrawalParams:
                context.preparationOutput.value.withdrawalParams,
              nearIntentsNetwork: isNearIntentsNetwork(formValues.blockchain),
            },
            appFeeRecipient: context.appFeeRecipient,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },
            actions: [
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
    },
  },

  initial: "editing",
})
