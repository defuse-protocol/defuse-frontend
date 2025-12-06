import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import { formatUnits } from "viem"
import {
  type ActorRefFrom,
  type InputFrom,
  assign,
  cancel,
  emit,
  sendTo,
  setup,
  spawnChild,
} from "xstate"
import { emitEvent } from "../../services/emitter"
import type { QuoteResult } from "../../services/quoteService"
import type { BaseTokenInfo, TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getAnyBaseTokenInfo,
} from "../../utils/tokenUtils"
import { isNearIntentsNetwork } from "../withdraw/components/WithdrawForm/utils"
import {
  type Events as Background1csWithdrawQuoterEvents,
  type ParentEvents as Background1csWithdrawQuoterParentEvents,
  background1csWithdrawQuoterMachine,
} from "./background1csWithdrawQuoterMachine"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  balancesSelector,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import {
  poaBridgeInfoActor,
  waitPOABridgeInfoActor,
} from "./poaBridgeInfoActor"
import {
  type Events as WithdrawFormEvents,
  type ParentEvents as WithdrawFormParentEvents,
  withdrawFormReducer,
} from "./withdrawFormReducer"
import {
  type Output as WithdrawIntent1csMachineOutput,
  withdrawIntent1csMachine,
} from "./withdrawIntent1csMachine"
import { withdrawStatus1csMachine } from "./withdrawStatus1csMachine"

export type Context = {
  user: {
    identifier: string
    method: AuthMethod
  } | null
  error: Error | null
  quote1cs: QuoteResult | null
  quote1csError: string | null
  slippageBasisPoints: number
  intentCreationResult: WithdrawIntent1csMachineOutput | null
  intentRefs: ActorRefFrom<typeof withdrawStatus1csMachine>[]
  tokenList: TokenInfo[]
  depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  withdrawFormRef: ActorRefFrom<typeof withdrawFormReducer>
  poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  submitDeps: {
    userAddress: string
    userChainType: AuthMethod
    nearClient: providers.Provider
  } | null
  referral?: string
  userAddress: string | null
  appFeeRecipient: string
  priceChangeDialog: null | {
    pendingNewOppositeAmount: { amount: bigint; decimals: number }
    previousOppositeAmount: { amount: bigint; decimals: number }
  }
}

type PassthroughEvent = {
  type: "WITHDRAW_1CS_SETTLED"
  data: {
    depositAddress: string
    status: string
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    recipient: string
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
      | {
          type: "SET_SLIPPAGE"
          params: {
            slippageBasisPoints: number
          }
        }
      | Background1csWithdrawQuoterParentEvents
      | DepositedBalanceEvents
      | WithdrawFormEvents
      | WithdrawFormParentEvents
      | {
          type: "PRICE_CHANGE_CONFIRMATION_REQUEST"
          params: {
            newOppositeAmount: { amount: bigint; decimals: number }
            previousOppositeAmount: { amount: bigint; decimals: number }
          }
        }
      | { type: "PRICE_CHANGE_CONFIRMED" }
      | { type: "PRICE_CHANGE_CANCELLED" }
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      withdrawRef1cs: "withdraw1csActor"
      background1csWithdrawQuoterRef: "background1csWithdrawQuoterActor"
    },
  },
  actors: {
    // biome-ignore lint/suspicious/noExplicitAny: bypass xstate+ts bloating; be careful when interacting with `depositedBalanceActor` string
    depositedBalanceActor: depositedBalanceMachine as any,
    withdraw1csActor: withdrawIntent1csMachine,
    withdrawStatus1csActor: withdrawStatus1csMachine,
    withdrawFormActor: withdrawFormReducer,
    poaBridgeInfoActor: poaBridgeInfoActor,
    waitPOABridgeInfoActor: waitPOABridgeInfoActor,
    background1csWithdrawQuoterActor: background1csWithdrawQuoterMachine,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },

    setUser: assign({
      user: (_, v: Context["user"]) => v,
    }),
    setUserAddress: assign({
      userAddress: (_, value: Context["userAddress"]) => value,
    }),
    clearUserAddress: assign({
      userAddress: null,
    }),
    clearUser: assign({
      user: null,
    }),
    setIntentCreationResult: assign({
      intentCreationResult: (_, value: WithdrawIntent1csMachineOutput) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),

    passthroughEvent: emit((_, event: PassthroughEvent) => event),

    setSubmitDeps: assign({
      submitDeps: (_, value: Context["submitDeps"]) => value,
    }),
    setSlippage: assign({
      slippageBasisPoints: (_, params: { slippageBasisPoints: number }) =>
        params.slippageBasisPoints,
    }),

    emitWithdrawalInitiated: ({ context }) => {
      const withdrawContext = context.withdrawFormRef.getSnapshot().context
      const { quote1cs } = context

      const fee_estimate =
        quote1cs != null && quote1cs.tag === "ok"
          ? calculateFeeFromQuote(quote1cs, withdrawContext.tokenOut.decimals)
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

    spawnBackground1csWithdrawQuoterRef: spawnChild(
      "background1csWithdrawQuoterActor",
      {
        id: "background1csWithdrawQuoterRef",
        input: ({ self }) => ({ parentRef: self }),
      }
    ),

    sendToBackground1csWithdrawQuoterRefNewQuoteInput: sendTo(
      "background1csWithdrawQuoterRef",
      ({ context }): Background1csWithdrawQuoterEvents => {
        const formContext = context.withdrawFormRef.getSnapshot().context

        assert(formContext.parsedAmount != null, "amount not set")

        const user =
          context.user ??
          ({ identifier: "check-price", method: AuthMethod.Near } as const)

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: getAnyBaseTokenInfo(formContext.tokenIn),
            tokenOut: formContext.tokenOut,
            amount: formContext.parsedAmount,
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              user.identifier,
              user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            userAddress: user.identifier,
            userChainType: user.method,
            recipient: formContext.parsedRecipient ?? "",
          },
        }
      },
      {
        id: "sendToBackground1csWithdrawQuoterRefNewQuoteInputRequest",
        delay: 500,
      }
    ),

    cancelSendToBackground1csWithdrawQuoterRefNewQuoteInput: cancel(
      "sendToBackground1csWithdrawQuoterRefNewQuoteInputRequest"
    ),

    sendToBackground1csWithdrawQuoterRefPause: sendTo(
      "background1csWithdrawQuoterRef",
      {
        type: "PAUSE",
      }
    ),

    process1csWithdrawQuote: assign({
      quote1cs: ({ event }) => {
        if (event.type !== "NEW_1CS_WITHDRAW_QUOTE") {
          return null
        }

        const { result, tokenInAssetId, tokenOutAssetId } = event.params

        if ("ok" in result) {
          const quote: QuoteResult = {
            tag: "ok",
            value: {
              quoteHashes: [],
              expirationTime: new Date(0).toISOString(),
              tokenDeltas: [
                [tokenInAssetId, -BigInt(result.ok.quote.amountIn)],
                [tokenOutAssetId, BigInt(result.ok.quote.amountOut)],
              ],
              appFee: [],
            },
          }

          return quote
        }

        const errorQuote: QuoteResult = {
          tag: "err",
          value: {
            reason: "ERR_NO_QUOTES_1CS" as const,
          },
        }
        return errorQuote
      },
      quote1csError: ({ event }) => {
        if (event.type !== "NEW_1CS_WITHDRAW_QUOTE") {
          return null
        }

        const { result } = event.params
        return "ok" in result ? null : result.err
      },
    }),

    clearQuote1cs: assign({ quote1cs: null }),
    clear1csError: assign({ quote1csError: null }),

    updateMinReceivedAmount: ({ context }) => {
      const { quote1cs } = context
      if (quote1cs == null || quote1cs.tag !== "ok") {
        context.withdrawFormRef.send({
          type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT",
          params: { minReceivedAmount: null },
        })
        return
      }

      const formContext = context.withdrawFormRef.getSnapshot().context
      const amountOut = quote1cs.value.tokenDeltas[1][1]

      context.withdrawFormRef.send({
        type: "WITHDRAW_FORM.UPDATE_MIN_RECEIVED_AMOUNT",
        params: {
          minReceivedAmount: {
            amount: amountOut,
            decimals: formContext.tokenOut.decimals,
          },
        },
      })
    },

    spawnWithdrawStatus1csActor: assign({
      intentRefs: (
        { context, spawn, self },
        output: WithdrawIntent1csMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

        const formValues = context.withdrawFormRef.getSnapshot().context

        const withdrawStatus1csRef = spawn("withdrawStatus1csActor", {
          id: `withdraw-1cs-${output.value.depositAddress}`,
          input: {
            parentRef: self,
            intentHash: output.value.intentHash,
            depositAddress: output.value.depositAddress,
            tokenIn: formValues.tokenIn,
            tokenOut: formValues.tokenOut,
            totalAmountIn: output.value.intentDescription.totalAmountIn,
            totalAmountOut: output.value.intentDescription.totalAmountOut,
            intentDescription: output.value.intentDescription,
          },
        })

        const { submitDeps, quote1cs } = context

        assert(submitDeps != null)

        if (quote1cs != null && quote1cs.tag === "ok") {
          const amountOut = quote1cs.value.tokenDeltas[1][1]
          emitEvent("withdrawal_confirmed", {
            tx_hash: output.value.intentHash,
            received_amount: formatUnits(
              amountOut,
              formValues.tokenOut.decimals
            ),
            actual_fee: calculateFeeFromQuote(
              quote1cs,
              formValues.tokenOut.decimals
            ),
            destination_chain: submitDeps.userChainType,
          })
        }

        return [withdrawStatus1csRef, ...context.intentRefs]
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

    openPriceChangeDialog: assign({
      priceChangeDialog: (
        _,
        params: {
          newOppositeAmount: { amount: bigint; decimals: number }
          previousOppositeAmount: { amount: bigint; decimals: number }
        }
      ) => ({
        pendingNewOppositeAmount: params.newOppositeAmount,
        previousOppositeAmount: params.previousOppositeAmount,
      }),
    }),
    closePriceChangeDialog: assign({ priceChangeDialog: null }),
    sendToWithdrawRef1csConfirm: sendTo("withdrawRef1cs", () => ({
      type: "PRICE_CHANGE_CONFIRMED",
    })),
    sendToWithdrawRef1csCancel: sendTo("withdrawRef1cs", () => ({
      type: "PRICE_CHANGE_CANCELLED",
    })),
  },
  guards: {
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

      // For Near Intents, we don't need 1cs quoting
      if (isNearIntentsNetwork(formContext.blockchain)) {
        return false
      }

      return (
        formContext.parsedAmount != null &&
        formContext.parsedRecipient != null &&
        formContext.cexFundsLooseConfirmation !== "not_confirmed"
      )
    },

    canSubmit1cs: ({ context }) => {
      const formContext = context.withdrawFormRef.getSnapshot().context
      return (
        formContext.parsedAmount != null &&
        formContext.parsedRecipient != null &&
        formContext.cexFundsLooseConfirmation !== "not_confirmed" &&
        context.quote1cs != null &&
        context.quote1cs.tag === "ok"
      )
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",
  },
}).createMachine({
  id: "withdraw-ui",

  context: ({ input, spawn, self }) => ({
    user: null,
    error: null,
    quote1cs: null,
    quote1csError: null,
    slippageBasisPoints: 30, // 0.3% default
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
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
    referral: input.referral,
    appFeeRecipient: input.appFeeRecipient,
    priceChangeDialog: null,
  }),

  entry: ["fetchPOABridgeInfo", "spawnBackground1csWithdrawQuoterRef"],

  on: {
    WITHDRAW_1CS_SETTLED: {
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
        {
          type: "setUser",
          params: ({ event }) => ({
            identifier: event.params.userAddress,
            method: event.params.userChainType,
          }),
        },
      ],
    },

    LOGOUT: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        "clearUserAddress",
        "clearUser",
      ],
    },

    PRICE_CHANGE_CONFIRMATION_REQUEST: {
      actions: {
        type: "openPriceChangeDialog",
        params: ({ event }) => ({
          newOppositeAmount: event.params.newOppositeAmount,
          previousOppositeAmount: event.params.previousOppositeAmount,
        }),
      },
    },
    PRICE_CHANGE_CONFIRMED: {
      actions: ["closePriceChangeDialog", "sendToWithdrawRef1csConfirm"],
    },
    PRICE_CHANGE_CANCELLED: {
      actions: ["closePriceChangeDialog", "sendToWithdrawRef1csCancel"],
    },

    SET_SLIPPAGE: {
      actions: [
        {
          type: "setSlippage",
          params: ({ event }) => ({
            slippageBasisPoints: event.params.slippageBasisPoints,
          }),
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

                return {
                  balances,
                  quote: context.quote1cs,
                }
              },
            },
          },
          {
            target: ".reset_quote",
          },
        ],

        WITHDRAW_FORM_FIELDS_CHANGED: ".reset_quote",

        NEW_1CS_WITHDRAW_QUOTE: {
          actions: ["process1csWithdrawQuote", "updateMinReceivedAmount"],
        },

        submit: {
          target: ".done",
          guard: "canSubmit1cs",
          actions: [
            "clearIntentCreationResult",
            { type: "setSubmitDeps", params: ({ event }) => event.params },
          ],
        },

        SET_SLIPPAGE: {
          target: ".reset_quote",
          actions: [
            {
              type: "setSlippage",
              params: ({ event }) => ({
                slippageBasisPoints: event.params.slippageBasisPoints,
              }),
            },
          ],
        },
      },

      states: {
        idle: {},

        reset_quote: {
          entry: [
            "sendToBackground1csWithdrawQuoterRefPause",
            "cancelSendToBackground1csWithdrawQuoterRefNewQuoteInput",
            "clearQuote1cs",
            "clear1csError",
            "updateMinReceivedAmount",
          ],
          always: [
            {
              target: "waiting_1cs_quote",
              guard: "isWithdrawParamsComplete",
              actions: "sendToBackground1csWithdrawQuoterRefNewQuoteInput",
            },
            {
              target: "idle",
            },
          ],
        },

        waiting_1cs_quote: {
          on: {
            NEW_1CS_WITHDRAW_QUOTE: {
              target: "idle",
              actions: ["process1csWithdrawQuote", "updateMinReceivedAmount"],
            },
          },
        },

        done: {
          type: "final",
        },
      },

      onDone: {
        target: "submitting_1cs",
        actions: ["emitWithdrawalInitiated"],
      },
    },

    submitting_1cs: {
      invoke: {
        id: "withdrawRef1cs",
        src: "withdraw1csActor",

        input: ({ context, self }) => {
          assert(context.submitDeps, "submitDeps is null")
          assert(
            context.quote1cs != null && context.quote1cs.tag === "ok",
            "quote1cs is not ready"
          )

          const formValues = context.withdrawFormRef.getSnapshot().context
          const recipient = formValues.parsedRecipient
          assert(recipient, "recipient is null")
          assert(formValues.parsedAmount, "parsedAmount is null")

          const snapshot = self.getSnapshot()
          const depositedBalanceRef:
            | ActorRefFrom<typeof depositedBalanceMachine>
            | undefined = snapshot.children.depositedBalanceRef
          const balances = balancesSelector(depositedBalanceRef?.getSnapshot())
          const amountInTokenBalance = computeTotalBalanceDifferentDecimals(
            formValues.tokenIn,
            balances
          )
          assert(
            amountInTokenBalance != null,
            "amountInTokenBalance is invalid"
          )

          const amountOut = context.quote1cs.value.tokenDeltas[1][1]

          return {
            tokenIn: formValues.tokenOut, // tokenOut is BaseTokenInfo which matches tokenIn for withdraw
            tokenOut: formValues.tokenOut,
            amountIn: formValues.parsedAmount,
            amountOut: {
              amount: amountOut,
              decimals: formValues.tokenOut.decimals,
            },
            amountInTokenBalance: amountInTokenBalance.amount,
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.submitDeps.userAddress,
              context.submitDeps.userChainType
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            userAddress: context.submitDeps.userAddress,
            userChainType: context.submitDeps.userChainType,
            nearClient: context.submitDeps.nearClient,
            recipient,
            previousOppositeAmount: {
              amount: amountOut,
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
              "sendToBackground1csWithdrawQuoterRefPause",
              "cancelSendToBackground1csWithdrawQuoterRefNewQuoteInput",
              {
                type: "spawnWithdrawStatus1csActor",
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

function calculateFeeFromQuote(
  quote: QuoteResult,
  decimals: number
): string | null {
  if (quote.tag !== "ok") return null

  const amountIn = -quote.value.tokenDeltas[0][1]
  const amountOut = quote.value.tokenDeltas[1][1]
  const fee = amountIn - amountOut

  return formatUnits(fee > 0n ? fee : 0n, decimals)
}
