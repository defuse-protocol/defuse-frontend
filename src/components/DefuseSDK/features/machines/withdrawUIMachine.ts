import { authIdentity } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
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
import {
  computeTotalBalanceDifferentDecimals,
  netDownAmount,
} from "../../utils/tokenUtils"
import { exceedsBalance } from "../withdraw/utils/exactOutBudget"
import type { AmountModeFallbackNotice } from "../withdraw/utils/exactOutBudget"
import { matchesWithdrawQuoteInput } from "../withdraw/utils/withdrawQuoteUtils"
import type {
  ParentEvents as BackgroundWithdraw1csQuoterParentEvents,
  WithdrawQuote1csInput,
} from "./backgroundWithdraw1csQuoterMachine"
import { backgroundWithdraw1csQuoterMachine } from "./backgroundWithdraw1csQuoterMachine"
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
  type Output as Withdraw1csMachineOutput,
  withdraw1csMachine,
} from "./withdraw1csMachine"
import {
  type Events as WithdrawFormEvents,
  type ParentEvents as WithdrawFormParentEvents,
  withdrawFormReducer,
} from "./withdrawFormReducer"
import { requestWithdrawQuote } from "./withdrawQuoteActions"

function safeParseBigInt(value: string): bigint | null {
  try {
    return BigInt(value)
  } catch {
    return null
  }
}

type QuoteResult =
  | {
      tag: "ok"
      value: {
        quote: {
          amountIn: string
          amountOut: string
          deadline?: string
          timeEstimate?: number
        }
        appFee: [string, bigint][]
      }
    }
  | { tag: "err"; value: { reason: string } }

export type AmountMode =
  | QuoteRequest.swapType.EXACT_INPUT
  | QuoteRequest.swapType.EXACT_OUTPUT

type QuoteEvent = Extract<
  BackgroundWithdraw1csQuoterParentEvents,
  { type: "NEW_WITHDRAW_1CS_QUOTE" }
>
type QuoteApiResult = QuoteEvent["params"]["result"]

function toQuoteResult(result: QuoteApiResult): QuoteResult {
  if ("ok" in result) {
    return { tag: "ok", value: result.ok }
  }
  return { tag: "err", value: { reason: result.err } }
}

function matchesWithdrawQuoteContext(
  context: Context,
  event: QuoteEvent
): boolean {
  return matchesWithdrawQuoteInput({
    formContext: context.withdrawFormRef.getSnapshot().context,
    quoteInput: event.params.quoteInput,
    userAddress: context.userAddress,
    userChainType: context.userChainType,
    tokenList: context.tokenList,
    balances: balancesSelector(context.depositedBalanceRef?.getSnapshot()),
    slippageBasisPoints: context.slippageBasisPoints,
    swapType: context.amountMode,
  })
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

export type Context = {
  error: Error | null
  intentCreationResult: Withdraw1csMachineOutput | null
  intentRefs: ActorRefFrom<typeof intentStatusMachine>[]
  tokenList: TokenInfo[]
  depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  withdrawFormRef: ActorRefFrom<typeof withdrawFormReducer>
  poaBridgeInfoRef: ActorRefFrom<typeof poaBridgeInfoActor>
  backgroundQuoterRef: ActorRefFrom<
    typeof backgroundWithdraw1csQuoterMachine
  > | null
  submitDeps: {
    userAddress: string
    userChainType: AuthMethod
    nearClient: providers.Provider
  } | null
  quoteResult: QuoteResult | null
  quoteInput: WithdrawQuote1csInput | null
  slippageBasisPoints: number
  amountMode: AmountMode
  priceChangeDialog: null | {
    pendingNewOppositeAmount: { amount: bigint; decimals: number }
    previousOppositeAmount: { amount: bigint; decimals: number }
  }
  amountModeFallbackNotice: AmountModeFallbackNotice | null
  referral?: string
  userAddress: string | null
  userChainType: AuthMethod | null
}

export const withdrawUIMachine = setup({
  types: {
    input: {} as {
      tokenIn: TokenInfo
      tokenOut: BaseTokenInfo
      tokenList: TokenInfo[]
      referral?: string
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
      | BackgroundWithdraw1csQuoterParentEvents
      | DepositedBalanceEvents
      | WithdrawFormEvents
      | WithdrawFormParentEvents
      | PassthroughEvent
      | {
          type: "WITHDRAW_1CS_QUOTE_ERROR"
          params: { reason: string }
        }
      | {
          type: "FALLBACK_TO_EXACT_IN"
          params: { notice: AmountModeFallbackNotice | null }
        }
      | {
          type: "SET_SLIPPAGE"
          params: { slippageBasisPoints: number }
        }
      | {
          type: "SET_AMOUNT_MODE"
          params: { amountMode: AmountMode }
        },

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
    backgroundWithdraw1csQuoterActor: backgroundWithdraw1csQuoterMachine,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },

    setUserSession: assign({
      userAddress: (
        _,
        value: { userAddress: string; userChainType: AuthMethod }
      ) => value.userAddress,
      userChainType: (
        _,
        value: { userAddress: string; userChainType: AuthMethod }
      ) => value.userChainType,
    }),
    clearUserSession: assign({
      userAddress: null,
      userChainType: null,
    }),
    setIntentCreationResult: assign({
      intentCreationResult: (_, value: Withdraw1csMachineOutput) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),

    passthroughEvent: emit((_, event: PassthroughEvent) => event),

    setSubmitDeps: assign({
      submitDeps: (_, value: Context["submitDeps"]) => value,
    }),
    setQuoteResult: assign({
      quoteResult: (_, val: Context["quoteResult"]) => val,
    }),
    clearQuoteResult: assign({ quoteResult: null }),
    setQuoteInput: assign({
      quoteInput: (_, val: Context["quoteInput"]) => val,
    }),
    clearQuoteInput: assign({ quoteInput: null }),
    setSlippage: assign({
      slippageBasisPoints: (_, value: number) => value,
    }),
    setAmountMode: assign({
      amountMode: (_, value: AmountMode) => value,
    }),
    applyExactInFallback: assign({
      amountMode: (_) => QuoteRequest.swapType.EXACT_INPUT as AmountMode,
      amountModeFallbackNotice: (
        _,
        params: { notice: AmountModeFallbackNotice | null }
      ) => params.notice,
    }),
    clearAmountModeFallbackNotice: assign({ amountModeFallbackNotice: null }),

    emitWithdrawalInitiated: ({ context }) => {
      const withdrawContext = context.withdrawFormRef.getSnapshot().context
      assert(withdrawContext.parsedAmount != null, "parsedAmount is null")
      emitEvent("withdrawal_initiated", {
        token: withdrawContext.tokenIn.symbol,
        to_chain: withdrawContext.tokenOut.defuseAssetId,
        amount: withdrawContext.parsedAmount.toString(),
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

      const { quoteResult, submitDeps } = context
      assert(submitDeps != null)

      if (quoteResult != null && quoteResult.tag === "ok") {
        const amtIn = safeParseBigInt(quoteResult.value.quote.amountIn)
        const amtOut = safeParseBigInt(quoteResult.value.quote.amountOut)
        if (amtIn != null && amtOut != null) {
          emitEvent("withdrawal_confirmed", {
            tx_hash: output.value.intentHash,
            received_amount: quoteResult.value.quote.amountOut,
            actual_fee: amtIn - amtOut,
            destination_chain: submitDeps.userChainType,
          })
        }
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

    setExecutionQuote: assign({
      priceChangeDialog: (
        _,
        params: {
          newOppositeAmount: { amount: bigint; decimals: number }
          previousOppositeAmount: { amount: bigint; decimals: number }
        }
      ) => {
        if (
          params.newOppositeAmount.amount < params.previousOppositeAmount.amount
        ) {
          return {
            pendingNewOppositeAmount: params.newOppositeAmount,
            previousOppositeAmount: params.previousOppositeAmount,
          }
        }
        return null
      },
    }),
    updateQuoteAmountOut: assign({
      quoteResult: ({ context }, params: { newAmountOut: bigint }) => {
        if (context.quoteResult?.tag !== "ok") return context.quoteResult
        return {
          ...context.quoteResult,
          value: {
            ...context.quoteResult.value,
            quote: {
              ...context.quoteResult.value.quote,
              amountOut: params.newAmountOut.toString(),
            },
          },
        }
      },
    }),
    clearExecutionQuote: assign({ priceChangeDialog: null }),

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

    requestQuote: ({ context, self }) =>
      requestWithdrawQuote({
        backgroundQuoterRef: context.backgroundQuoterRef,
        formContext: context.withdrawFormRef.getSnapshot().context,
        userAddress: context.userAddress,
        userChainType: context.userChainType,
        tokenList: context.tokenList,
        balances: balancesSelector(context.depositedBalanceRef.getSnapshot()),
        amountMode: context.amountMode,
        slippageBasisPoints: context.slippageBasisPoints,
        onQuoteError: (reason) =>
          self.send({
            type: "WITHDRAW_1CS_QUOTE_ERROR",
            params: { reason },
          }),
        onFallbackExactIn: () =>
          self.send({
            type: "FALLBACK_TO_EXACT_IN",
            params: { notice: null },
          }),
      }),

    pauseQuoter: ({ context }) => {
      context.backgroundQuoterRef?.send({ type: "PAUSE" })
    },
  },
  guards: {
    isTrue: (_, value: boolean) => value,
    isFalse: (_, value: boolean) => !value,

    isWithdrawParamsComplete: ({ context }) => {
      const formContext = context.withdrawFormRef.getSnapshot().context
      return (
        formContext.parsedAmount != null &&
        formContext.parsedAmount.amount > 0n &&
        formContext.parsedRecipient != null &&
        formContext.cexFundsLooseConfirmation !== "not_confirmed" &&
        context.userAddress != null &&
        context.userChainType != null
      )
    },

    isQuoteOk: ({ context }) => {
      if (context.quoteResult?.tag !== "ok") return false
      const { amountIn, amountOut } = context.quoteResult.value.quote
      const parsedAmountIn = safeParseBigInt(amountIn)
      if (parsedAmountIn == null || safeParseBigInt(amountOut) == null) {
        return false
      }

      if (
        context.amountMode === QuoteRequest.swapType.EXACT_OUTPUT &&
        context.quoteInput != null &&
        exceedsBalance(
          parsedAmountIn,
          computeTotalBalanceDifferentDecimals(
            context.quoteInput.tokenIn,
            context.depositedBalanceRef.getSnapshot().context.balances
          )
        )
      ) {
        return false
      }

      return true
    },

    isExecutionQuoteAffordable: (
      { context },
      params: { newAmountIn: { amount: bigint; decimals: number } }
    ) => {
      if (
        context.amountMode !== QuoteRequest.swapType.EXACT_OUTPUT ||
        context.quoteInput == null
      ) {
        return true
      }
      return !exceedsBalance(
        params.newAmountIn.amount,
        computeTotalBalanceDifferentDecimals(
          context.quoteInput.tokenIn,
          context.depositedBalanceRef.getSnapshot().context.balances
        )
      )
    },

    isFreshExactOutOverBalance: ({ context, event }) => {
      if (event.type !== "NEW_WITHDRAW_1CS_QUOTE") return false
      if (context.amountMode !== QuoteRequest.swapType.EXACT_OUTPUT)
        return false
      if (!("ok" in event.params.result)) return false
      if (!matchesWithdrawQuoteContext(context, event)) return false
      const parsedAmountIn = safeParseBigInt(
        event.params.result.ok.quote.amountIn
      )
      if (parsedAmountIn == null) return false
      return exceedsBalance(
        parsedAmountIn,
        computeTotalBalanceDifferentDecimals(
          event.params.quoteInput.tokenIn,
          context.depositedBalanceRef.getSnapshot().context.balances
        )
      )
    },

    isFreshWithdrawQuote: ({ context, event }) => {
      if (event.type !== "NEW_WITHDRAW_1CS_QUOTE") return false
      return matchesWithdrawQuoteContext(context, event)
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",
  },
}).createMachine({
  id: "withdraw-ui",

  context: ({ input, spawn, self }) => ({
    error: null,
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
    userAddress: null,
    userChainType: null,
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
    backgroundQuoterRef: spawn("backgroundWithdraw1csQuoterActor", {
      id: "backgroundQuoterRef",
      input: { parentRef: self },
    }),
    submitDeps: null,
    quoteResult: null,
    quoteInput: null,
    slippageBasisPoints: 1000,
    amountMode: QuoteRequest.swapType.EXACT_INPUT as AmountMode,
    priceChangeDialog: null,
    amountModeFallbackNotice: null,
    referral: input.referral,
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
          type: "setUserSession",
          params: ({ event }) => event.params,
        },
      ],
    },

    LOGOUT: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
        },
        "clearUserSession",
      ],
    },
  },

  states: {
    editing: {
      initial: "idle",

      on: {
        "WITHDRAW_FORM.*": {
          actions: [
            {
              type: "relayToWithdrawFormRef",
              params: ({ event }) => event,
            },
          ],
        },

        BALANCE_CHANGED: [
          {
            target: ".quoting",
            guard: "isWithdrawParamsComplete",
            actions: ["clearAmountModeFallbackNotice"],
          },
          {
            target: ".idle",
            actions: [
              "clearQuoteResult",
              "clearQuoteInput",
              "clearAmountModeFallbackNotice",
            ],
          },
        ],

        WITHDRAW_FORM_FIELDS_CHANGED: [
          {
            target: ".quoting",
            guard: "isWithdrawParamsComplete",
            actions: ["clearAmountModeFallbackNotice"],
          },
          {
            target: ".idle",
            actions: [
              "clearQuoteResult",
              "clearQuoteInput",
              "clearAmountModeFallbackNotice",
            ],
          },
        ],

        SET_SLIPPAGE: [
          {
            target: ".quoting",
            guard: "isWithdrawParamsComplete",
            actions: [
              {
                type: "setSlippage",
                params: ({ event }) => event.params.slippageBasisPoints,
              },
              "clearAmountModeFallbackNotice",
            ],
          },
          {
            target: ".idle",
            actions: [
              {
                type: "setSlippage",
                params: ({ event }) => event.params.slippageBasisPoints,
              },
              "clearQuoteResult",
              "clearQuoteInput",
              "clearAmountModeFallbackNotice",
            ],
          },
        ],

        SET_AMOUNT_MODE: [
          {
            target: ".quoting",
            guard: "isWithdrawParamsComplete",
            actions: [
              {
                type: "setAmountMode",
                params: ({ event }) => event.params.amountMode,
              },
              "clearAmountModeFallbackNotice",
            ],
          },
          {
            target: ".idle",
            actions: [
              {
                type: "setAmountMode",
                params: ({ event }) => event.params.amountMode,
              },
              "clearQuoteResult",
              "clearQuoteInput",
              "clearAmountModeFallbackNotice",
            ],
          },
        ],

        FALLBACK_TO_EXACT_IN: {
          target: ".quoting",
          reenter: true,
          actions: {
            type: "applyExactInFallback",
            params: ({ event }) => event.params,
          },
        },

        NEW_WITHDRAW_1CS_QUOTE: [
          {
            target: ".quoting",
            guard: "isFreshExactOutOverBalance",
            actions: {
              type: "applyExactInFallback",
              params: { notice: null },
            },
          },
          {
            guard: "isFreshWithdrawQuote",
            actions: [
              {
                type: "setQuoteResult",
                params: ({ event }) => toQuoteResult(event.params.result),
              },
              {
                type: "setQuoteInput",
                params: ({ event }) => event.params.quoteInput,
              },
            ],
          },
        ],

        WITHDRAW_1CS_QUOTE_ERROR: {
          actions: [
            {
              type: "setQuoteResult",
              params: ({ event }) => ({
                tag: "err" as const,
                value: { reason: event.params.reason },
              }),
            },
            "clearQuoteInput",
          ],
        },

        submit: {
          target: ".done",
          guard: "isQuoteOk",
          actions: [
            "clearIntentCreationResult",
            "clearAmountModeFallbackNotice",
            { type: "setSubmitDeps", params: ({ event }) => event.params },
            "emitWithdrawalInitiated",
            "pauseQuoter",
          ],
        },
      },

      states: {
        idle: {},

        quoting: {
          entry: ["clearQuoteResult", "clearQuoteInput", "requestQuote"],
          on: {
            NEW_WITHDRAW_1CS_QUOTE: [
              {
                target: "quoting",
                reenter: true,
                guard: "isFreshExactOutOverBalance",
                actions: {
                  type: "applyExactInFallback",
                  params: { notice: null },
                },
              },
              {
                target: "idle",
                guard: "isFreshWithdrawQuote",
                actions: [
                  {
                    type: "setQuoteResult",
                    params: ({ event }) => toQuoteResult(event.params.result),
                  },
                  {
                    type: "setQuoteInput",
                    params: ({ event }) => event.params.quoteInput,
                  },
                ],
              },
              { target: "idle" },
            ],
            WITHDRAW_1CS_QUOTE_ERROR: {
              target: "idle",
              actions: [
                {
                  type: "setQuoteResult",
                  params: ({ event }) => ({
                    tag: "err" as const,
                    value: { reason: event.params.reason },
                  }),
                },
                "clearQuoteInput",
              ],
            },
          },
        },

        done: {
          type: "final",
        },
      },

      onDone: {
        target: "submitting",
      },
    },

    submitting: {
      invoke: {
        id: "withdrawRef",
        src: "withdraw1csActor",

        input: ({ context, self }) => {
          assert(context.submitDeps, "submitDeps is null")
          assert(context.quoteInput, "quoteInput is null")

          const formValues = context.withdrawFormRef.getSnapshot().context
          const quoteInput = context.quoteInput

          return {
            tokenIn: quoteInput.tokenIn,
            tokenOut: formValues.tokenOut,
            tokenOutDeployment: formValues.tokenOutDeployment,
            swapType: context.amountMode,
            slippageBasisPoints: context.slippageBasisPoints,
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
            amountIn: quoteInput.amount,
            recipient: quoteInput.recipient,
            recipientType: quoteInput.recipientType,
            ...(quoteInput.destinationMemo
              ? { destinationMemo: quoteInput.destinationMemo }
              : {}),
            ...(isAuroraVirtualChain(formValues.tokenOutDeployment.chainName) &&
            formValues.parsedRecipient
              ? { virtualChainRecipient: formValues.parsedRecipient }
              : {}),
            destinationChainName: formValues.tokenOutDeployment.chainName,
            minAmountOut:
              context.quoteResult?.tag === "ok"
                ? (() => {
                    const amountOut = safeParseBigInt(
                      context.quoteResult.value.quote.amountOut
                    )
                    if (amountOut == null) return undefined
                    return netDownAmount(amountOut, context.slippageBasisPoints)
                  })()
                : undefined,
            previousOppositeAmount:
              context.quoteResult?.tag === "ok"
                ? {
                    amount: BigInt(context.quoteResult.value.quote.amountOut),
                    decimals: formValues.tokenOut.decimals,
                  }
                : { amount: 0n, decimals: formValues.tokenOut.decimals },
            parentRef: self,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },
            actions: [
              "clearExecutionQuote",
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
              "clearExecutionQuote",
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
        EXECUTION_QUOTE_READY: [
          {
            guard: {
              type: "isExecutionQuoteAffordable",
              params: ({ event }) => event.params,
            },
            actions: [
              {
                type: "updateQuoteAmountOut",
                params: ({ event }) => ({
                  newAmountOut: event.params.newOppositeAmount.amount,
                }),
              },
              {
                type: "setExecutionQuote",
                params: ({ event }) => ({
                  newOppositeAmount: event.params.newOppositeAmount,
                  previousOppositeAmount: event.params.previousOppositeAmount,
                }),
              },
              "sendToWithdrawRefConfirm",
            ],
          },
          {
            target: "#withdraw-ui.submitting",
            reenter: true,
            actions: [
              {
                type: "applyExactInFallback",
                params: { notice: "execution_balance_limit" as const },
              },
              "clearExecutionQuote",
            ],
          },
        ],
      },
    },
  },

  initial: "editing",
})
