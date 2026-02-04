import { AuthMethod, type authHandle } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import type { Quote1csInput } from "@src/components/DefuseSDK/features/machines/background1csQuoterMachine"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import { APP_FEE_BPS } from "@src/utils/environment"
import { logNoLiquidity } from "@src/utils/logCustom"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import { formatUnits } from "viem"
import {
  type ActorRefFrom,
  assertEvent,
  assign,
  cancel,
  emit,
  sendTo,
  setup,
  spawnChild,
} from "xstate"
import type { QuoteResult } from "../../services/quoteService"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import type { TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { parseUnits } from "../../utils/parse"
import {
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
  computeTotalDeltaDifferentDecimals,
  getAnyBaseTokenInfo,
  getTokenMaxDecimals,
  getUnderlyingBaseTokenInfos,
  hasMatchingTokenKeys,
} from "../../utils/tokenUtils"
import { getMinDeadlineMs } from "../otcDesk/utils/quoteUtils"
import {
  type Events as Background1csQuoterEvents,
  type ParentEvents as Background1csQuoterParentEvents,
  background1csQuoterMachine,
} from "./background1csQuoterMachine"
import {
  type Events as BackgroundQuoterEvents,
  type ParentEvents as BackgroundQuoterParentEvents,
  backgroundQuoterMachine,
} from "./backgroundQuoterMachine"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  balancesSelector,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import {
  type Output as SwapIntent1csMachineOutput,
  swapIntent1csMachine,
} from "./swapIntent1csMachine"
import {
  type Output as SwapIntentMachineOutput,
  swapIntentMachine,
} from "./swapIntentMachine"

function getTokenDecimals(token: TokenInfo) {
  return isBaseToken(token) ? token.decimals : token.groupedTokens[0].decimals
}

export type Context = {
  user: null | authHandle.AuthHandle
  error: Error | null
  quote: QuoteResult | null
  quote1csError: string | null
  formValues: {
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    amountIn: string
    amountOut: string
    swapType: QuoteRequest.swapType
  }
  parsedFormValues: {
    tokenIn: BaseTokenInfo
    tokenOut: BaseTokenInfo
    amountIn: TokenValue | null
    amountOut: TokenValue | null
  }
  intentCreationResult:
    | SwapIntentMachineOutput
    | SwapIntent1csMachineOutput
    | null
  tokenList: TokenInfo[]
  referral?: string
  slippageBasisPoints: number
  is1cs: boolean
  appFeeRecipient: string
  priceChangeDialog: null | {
    pendingNewOppositeAmount: { amount: bigint; decimals: number }
    previousOppositeAmount: { amount: bigint; decimals: number }
  }
}

type PassthroughEvent =
  | {
      type: "INTENT_SETTLED"
      data: {
        intentHash: string
        txHash: string
        tokenIn: TokenInfo
        tokenOut: TokenInfo
      }
    }
  | {
      type: "ONE_CLICK_SETTLED"
      data: {
        depositAddress: string
        status: string
        tokenIn: TokenInfo
        tokenOut: TokenInfo
      }
    }

type EmittedEvents = PassthroughEvent | { type: "INTENT_PUBLISHED" }

export const ONE_CLICK_PREFIX = "oneclick-"

export const swapUIMachine = setup({
  types: {
    input: {} as {
      tokenIn: TokenInfo
      tokenOut: TokenInfo
      tokenList: TokenInfo[]
      referral?: string
      is1cs: boolean
      appFeeRecipient: string
    },
    context: {} as Context,
    events: {} as
      | {
          type: "input"
          params: Partial<{
            tokenIn: TokenInfo
            tokenOut: TokenInfo
            amountIn: string
            amountOut: string
            swapType: QuoteRequest.swapType
          }>
        }
      | {
          type: "submit"
          params: {
            userAddress: string
            userChainType: AuthMethod
            nearClient: providers.Provider
          }
        }
      | {
          type: "BALANCE_CHANGED"
          params: {
            changedBalanceMapping: BalanceMapping
          }
        }
      | {
          type: "NEW_1CS_QUOTE"
          params: {
            quoteInput: Quote1csInput
            result:
              | {
                  ok: {
                    quote: {
                      amountIn: string
                      amountOut: string
                      deadline?: string
                      timeEstimate?: number
                    }
                    appFee: [string, bigint][]
                  }
                }
              | { err: string; originalRequest?: QuoteRequest | undefined }
            tokenInAssetId: string
            tokenOutAssetId: string
          }
        }
      | BackgroundQuoterParentEvents
      | Background1csQuoterParentEvents
      | DepositedBalanceEvents
      | { type: "REQUEST_REVIEW" }
      | { type: "CANCEL_REVIEW" }
      | {
          type: "PRICE_CHANGE_CONFIRMATION_REQUEST"
          params: {
            newOppositeAmount: { amount: bigint; decimals: number }
            previousOppositeAmount: { amount: bigint; decimals: number }
          }
        }
      | { type: "PRICE_CHANGE_CONFIRMED" }
      | { type: "PRICE_CHANGE_CANCELLED" }
      | {
          type: "SET_SLIPPAGE"
          params: {
            slippageBasisPoints: number
          }
        }
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      depositedBalanceRef: "depositedBalanceActor"
      backgroundQuoterRef: "backgroundQuoterActor"
      background1csQuoterRef: "background1csQuoterActor"
      swapRef: "swapActor"
      swapRef1cs: "swap1csActor"
    },
  },
  actors: {
    backgroundQuoterActor: backgroundQuoterMachine,
    background1csQuoterActor: background1csQuoterMachine,
    depositedBalanceActor: depositedBalanceMachine,
    swapActor: swapIntentMachine,
    swap1csActor: swapIntent1csMachine,
  },
  actions: {
    setUser: assign({
      user: (_, v: Context["user"]) => v,
    }),
    setFormValues: assign({
      formValues: (
        { context },
        {
          data,
        }: {
          data: Partial<{
            tokenIn: TokenInfo
            tokenOut: TokenInfo
            amountIn: string
            amountOut: string
          }>
        }
      ) => ({
        ...context.formValues,
        ...data,
      }),
    }),
    resetFormValueAmounts: assign({
      formValues: ({ context }) => {
        return {
          ...context.formValues,
          ...{
            amountIn: "",
            amountOut: "",
          },
        }
      },
    }),
    resetParsedFormValueAmounts: assign({
      parsedFormValues: ({ context }) => {
        return {
          ...context.parsedFormValues,
          ...{
            amountIn: null,
            amountOut: null,
          },
        }
      },
    }),
    parseFormValues: assign({
      parsedFormValues: ({ context }) => {
        const tokenIn = getAnyBaseTokenInfo(context.formValues.tokenIn)
        const tokenOut = getAnyBaseTokenInfo(context.formValues.tokenOut)

        try {
          const decimalsIn = context.is1cs
            ? getTokenDecimals(context.formValues.tokenIn)
            : getTokenMaxDecimals(context.formValues.tokenIn)
          const decimalsOut = context.is1cs
            ? getTokenDecimals(context.formValues.tokenOut)
            : getTokenMaxDecimals(context.formValues.tokenOut)
          return {
            tokenIn,
            tokenOut,
            amountIn:
              context.formValues.amountIn === "" ||
              Number.isNaN(+context.formValues.amountIn)
                ? null
                : {
                    amount: parseUnits(context.formValues.amountIn, decimalsIn),
                    decimals: decimalsIn,
                  },
            amountOut:
              context.formValues.amountOut === "" ||
              Number.isNaN(+context.formValues.amountOut)
                ? null
                : {
                    amount: parseUnits(
                      context.formValues.amountOut,
                      decimalsOut
                    ),
                    decimals: decimalsOut,
                  },
          }
        } catch {
          return {
            tokenIn,
            tokenOut,
            amountIn: null,
            amountOut: null,
          }
        }
      },
    }),
    updateFormValuesWithQuoteData: assign({
      formValues: ({ context }) => {
        const quote = context.quote
        const isExactInput =
          context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
        const fieldNameToUpdate = isExactInput ? "amountOut" : "amountIn"
        if (quote === null || quote.tag === "err") {
          return {
            ...context.formValues,
            ...{
              [fieldNameToUpdate]: "",
            },
          }
        }
        const tokenDeltas = quote.value.tokenDeltas
        if (hasMatchingTokenKeys(tokenDeltas)) {
          const amount = isExactInput ? tokenDeltas[1][1] : tokenDeltas[0][1]
          return {
            ...context.formValues,
            ...{
              [fieldNameToUpdate]: formatUnits(
                amount < 0n ? -amount : amount,
                context.parsedFormValues.tokenIn.decimals // same as tokenOut.decimals
              ),
            },
          }
        }

        const totalAmount = computeTotalDeltaDifferentDecimals(
          [
            isExactInput
              ? context.parsedFormValues.tokenOut
              : context.parsedFormValues.tokenIn,
          ],
          quote.value.tokenDeltas
        )
        return {
          ...context.formValues,
          ...{
            [fieldNameToUpdate]: formatUnits(
              totalAmount.amount < 0n
                ? -totalAmount.amount
                : totalAmount.amount,
              totalAmount.decimals
            ),
          },
        }
      },
    }),
    updateUIAmount: () => {
      throw new Error("not implemented")
    },
    setQuote: assign({
      quote: ({ context }, newQuote: QuoteResult) => {
        const prevQuote = context.quote
        if (
          newQuote.tag === "ok" ||
          prevQuote == null ||
          prevQuote.tag === "err"
        ) {
          return newQuote
        }
        return prevQuote
      },
    }),
    clearQuote: assign({ quote: null }),
    clearError: assign({ error: null }),
    clear1csError: assign({ quote1csError: null }),
    setSlippage: assign({
      slippageBasisPoints: (_, params: { slippageBasisPoints: number }) =>
        params.slippageBasisPoints,
    }),
    setIntentCreationResult: assign({
      intentCreationResult: (
        _,
        value: SwapIntentMachineOutput | SwapIntent1csMachineOutput
      ) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),
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
    sendToSwapRef1csConfirm: sendTo("swapRef1cs", () => ({
      type: "PRICE_CHANGE_CONFIRMED",
    })),
    sendToSwapRef1csCancel: sendTo("swapRef1cs", () => ({
      type: "PRICE_CHANGE_CANCELLED",
    })),
    passthroughEvent: emit((_, event: PassthroughEvent) => event),
    spawnBackgroundQuoterRef: spawnChild("backgroundQuoterActor", {
      id: "backgroundQuoterRef",
      input: ({ self }) => ({ parentRef: self }),
    }),
    spawnBackground1csQuoterRef: spawnChild("background1csQuoterActor", {
      id: "background1csQuoterRef",
      input: ({ self }) => ({ parentRef: self }),
    }),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefNewQuoteInput: sendTo(
      "backgroundQuoterRef",
      ({ context, self }): BackgroundQuoterEvents => {
        const snapshot = self.getSnapshot()

        // However knows how to access the child's state, please update this
        const depositedBalanceRef:
          | ActorRefFrom<typeof depositedBalanceMachine>
          | undefined = snapshot.children.depositedBalanceRef
        const balances = balancesSelector(depositedBalanceRef?.getSnapshot())

        assert(context.parsedFormValues.amountIn != null, "amountIn is not set")

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.formValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            balances: balances ?? {},
            appFeeBps: computeAppFeeBps(
              APP_FEE_BPS,
              context.formValues.tokenIn,
              context.formValues.tokenOut,
              context.appFeeRecipient,
              context.user
            ),
          },
        }
      },
      { id: "sendToBackgroundQuoterRefNewQuoteInputRequest", delay: 500 }
    ),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefPause: sendTo("backgroundQuoterRef", {
      type: "PAUSE",
    }),
    sendToBackground1csQuoterRefNewQuoteInput: sendTo(
      "background1csQuoterRef",
      ({ context }): Background1csQuoterEvents => {
        const amount =
          context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
            ? context.parsedFormValues.amountIn
            : context.parsedFormValues.amountOut

        assert(amount !== null, "amount not set")

        const user =
          context.user ??
          ({ identifier: "check-price", method: AuthMethod.Near } as const)

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amount,
            swapType: context.formValues.swapType,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              user.identifier,
              user.method
            ),
            deadline: getMinDeadlineMs(10 * 60 * 1000), // 10 minutes
            userAddress: user.identifier,
            userChainType: user.method,
          },
        }
      },
      { id: "sendToBackground1csQuoterRefNewQuoteInputRequest", delay: 500 }
    ),
    cancelSendToBackgroundQuoterRefNewQuoteInput: cancel(
      "sendToBackgroundQuoterRefNewQuoteInputRequest"
    ),
    cancelSendToBackground1csQuoterRefNewQuoteInput: cancel(
      "sendToBackground1csQuoterRefNewQuoteInputRequest"
    ),
    sendToBackground1csQuoterRefPause: sendTo("background1csQuoterRef", {
      type: "PAUSE",
    }),

    spawnDepositedBalanceRef: spawnChild("depositedBalanceActor", {
      id: "depositedBalanceRef",
      input: ({ self, context }) => ({
        parentRef: self,
        tokenList: context.tokenList,
      }),
    }),
    relayToDepositedBalanceRef: sendTo(
      "depositedBalanceRef",
      (_, event: DepositedBalanceEvents) => event
    ),
    sendToDepositedBalanceRefRefresh: sendTo("depositedBalanceRef", (_) => ({
      type: "REQUEST_BALANCE_REFRESH",
    })),

    sendToDepositedBalanceRefRemoveAccount: sendTo(
      "depositedBalanceRef",
      (_, params: { depositAddress: string }) => ({
        type: "REMOVE_ACCOUNT",
        params: {
          accountId: authIdentity.authHandleToIntentsUserId(
            params.depositAddress,
            "near"
          ),
        },
      })
    ),

    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToSwapRefNewQuote: sendTo(
      "swapRef",
      (_, event: BackgroundQuoterParentEvents) => event
    ),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

    log1csNoLiquidity: ({ self, event }) => {
      if (
        event.type !== "NEW_1CS_QUOTE" ||
        !("err" in event.params.result) ||
        event.params.result.err !== "Failed to get quote" ||
        event.params.result.originalRequest === undefined
      ) {
        return
      }

      // log only if we can be sure
      // that the user has sufficient balance
      const snapshot = self.getSnapshot()
      const depositedBalanceRef:
        | ActorRefFrom<typeof depositedBalanceMachine>
        | undefined = snapshot.children.depositedBalanceRef
      const balances = balancesSelector(depositedBalanceRef?.getSnapshot())

      if (!balances) {
        return
      }

      const tokenInBalance = computeTotalBalanceDifferentDecimals(
        event.params.quoteInput.tokenIn,
        balances
      )

      if (!tokenInBalance) {
        return
      }

      const hasSufficientBalance =
        compareAmounts(tokenInBalance, event.params.quoteInput.amount) !== -1

      if (!hasSufficientBalance) {
        return
      }

      logNoLiquidity({
        tokenIn: event.params.quoteInput.tokenIn,
        tokenOut: event.params.quoteInput.tokenOut,
        amount: formatUnits(
          event.params.quoteInput.amount.amount,
          event.params.quoteInput.amount.decimals
        ),
        contexts: {
          originalRequest: event.params.result.originalRequest,
        },
      })
    },

    process1csQuote: assign({
      quote: ({ event }) => {
        if (event.type !== "NEW_1CS_QUOTE") {
          return null
        }

        const { result, tokenInAssetId, tokenOutAssetId } = event.params

        if ("ok" in result) {
          const quote: QuoteResult = {
            tag: "ok",
            value: {
              quoteHashes: [],
              // dry run doesn't have expiration time
              expirationTime: new Date(0).toISOString(),
              tokenDeltas: [
                [tokenInAssetId, -BigInt(result.ok.quote.amountIn)],
                [tokenOutAssetId, BigInt(result.ok.quote.amountOut)],
              ],
              appFee: result.ok.appFee,
              timeEstimate: result.ok.quote.timeEstimate,
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
        if (event.type !== "NEW_1CS_QUOTE") {
          return null
        }

        const { result } = event.params
        return "ok" in result ? null : result.err
      },
    }),
  },
  guards: {
    isQuoteValidAndNot1cs: ({ context }) => {
      return (
        !context.is1cs && context.quote != null && context.quote.tag === "ok"
      )
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",

    isFormValidAndNot1cs: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n &&
        !context.is1cs
      )
    },
    isFormValidAnd1cs: ({ context }) => {
      if (context.is1cs === false) return false
      const amount =
        context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
          ? context.parsedFormValues.amountIn
          : context.parsedFormValues.amountOut

      return amount !== null && amount.amount > 0n
    },

    canReview: ({ context }) => {
      if (context.is1cs) {
        return (
          context.quote?.tag === "ok" &&
          context.parsedFormValues.amountIn != null &&
          context.parsedFormValues.amountIn.amount > 0n &&
          context.parsedFormValues.amountOut != null &&
          context.parsedFormValues.amountOut.amount > 0n
        )
      }

      return (
        context.quote?.tag === "ok" &&
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n
      )
    },
  },
}).createMachine({
  /** @xstate-layout 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 */
  id: "swap-ui",

  context: ({ input }) => ({
    user: null,
    error: null,
    quote: null,
    quote1csError: null,
    formValues: {
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: "",
      amountOut: "",
      swapType: QuoteRequest.swapType.EXACT_INPUT,
    },
    parsedFormValues: {
      tokenIn: getAnyBaseTokenInfo(input.tokenIn),
      tokenOut: getAnyBaseTokenInfo(input.tokenOut),
      amountIn: null,
      amountOut: null,
    },
    intentCreationResult: null,
    tokenList: input.tokenList,
    referral: input.referral,
    slippageBasisPoints: 10_000, // 1% default, will be overridden from localStorage
    is1cs: input.is1cs,
    appFeeRecipient: input.appFeeRecipient,
    priceChangeDialog: null,
  }),

  entry: [
    "spawnBackgroundQuoterRef",
    "spawnBackground1csQuoterRef",
    "spawnDepositedBalanceRef",
  ],

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

    ONE_CLICK_SETTLED: {
      actions: [
        {
          type: "passthroughEvent",
          params: ({ event }) => event,
        },
        "sendToDepositedBalanceRefRefresh",
        {
          type: "sendToDepositedBalanceRefRemoveAccount",
          params: ({ event }) => ({
            depositAddress: event.data.depositAddress,
          }),
        },
      ],
    },

    BALANCE_CHANGED: [
      {
        guard: "isFormValidAndNot1cs",
        actions: "sendToBackgroundQuoterRefNewQuoteInput",
      },
      {
        guard: "isFormValidAnd1cs",
        actions: "sendToBackground1csQuoterRefNewQuoteInput",
      },
    ],

    LOGIN: {
      actions: [
        {
          type: "relayToDepositedBalanceRef",
          params: ({ event }) => event,
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
        { type: "setUser", params: null },
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
      actions: [
        { type: "closePriceChangeDialog" },
        { type: "sendToSwapRef1csConfirm" },
      ],
    },
    PRICE_CHANGE_CANCELLED: {
      actions: [
        { type: "closePriceChangeDialog" },
        { type: "sendToSwapRef1csCancel" },
      ],
    },
    SET_SLIPPAGE: {
      actions: {
        type: "setSlippage",
        params: ({ event }) => ({
          slippageBasisPoints: event.params.slippageBasisPoints,
        }),
      },
    },
  },

  states: {
    editing: {
      on: {
        REQUEST_REVIEW: {
          target: ".reviewing",
          guard: "canReview",
        },
        CANCEL_REVIEW: {
          target: ".idle",
        },

        submit: [
          {
            target: "submitting_1cs",
            guard: "isFormValidAnd1cs",
            actions: [
              "parseFormValues",
              "clearIntentCreationResult",
              "sendToBackground1csQuoterRefPause",
              "cancelSendToBackground1csQuoterRefNewQuoteInput",
            ],
          },
          {
            target: "submitting",
            guard: "isQuoteValidAndNot1cs",
            actions: ["parseFormValues", "clearIntentCreationResult"],
          },
        ],

        // input: When form input changes, reset quote and parse new values.
        // NOTE: The SET_SLIPPAGE handler (line ~886) follows a similar pattern.
        // If you modify the action sequence here, consider if SET_SLIPPAGE needs the same changes.
        input: {
          target: ".validating",
          actions: [
            "sendToBackgroundQuoterRefPause",
            "sendToBackground1csQuoterRefPause",
            "cancelSendToBackgroundQuoterRefNewQuoteInput",
            "cancelSendToBackground1csQuoterRefNewQuoteInput",
            "clearQuote",
            "clearError",
            "clear1csError",
            {
              type: "setFormValues",
              params: ({ event }) => ({ data: event.params }),
            },
            "parseFormValues", // Keep in sync with SET_SLIPPAGE handler (line ~901, ~920)
          ],
        },

        NEW_QUOTE: {
          actions: [
            {
              type: "setQuote",
              params: ({ event }) => event.params.quote,
            },
            "updateFormValuesWithQuoteData",
            "parseFormValues",
            "updateUIAmount",
          ],
        },

        NEW_1CS_QUOTE: {
          actions: [
            "process1csQuote",
            "updateFormValuesWithQuoteData",
            "parseFormValues",
            "updateUIAmount",
            "log1csNoLiquidity",
          ],
        },

        SET_SLIPPAGE: [
          {
            guard: "isFormValidAndNot1cs",
            target: ".waiting_quote",
            actions: [
              // resetting everything both 1cs and not 1cs just in case
              {
                type: "setSlippage",
                params: ({ event }) => ({
                  slippageBasisPoints: event.params.slippageBasisPoints,
                }),
              },
              "sendToBackgroundQuoterRefPause",
              "sendToBackground1csQuoterRefPause",
              "cancelSendToBackgroundQuoterRefNewQuoteInput",
              "cancelSendToBackground1csQuoterRefNewQuoteInput",
              "clearQuote",
              "clearError",
              "clear1csError",
              {
                type: "updateFormValuesWithQuoteData",
              },
              "parseFormValues",
              "updateUIAmount",
              "sendToBackgroundQuoterRefNewQuoteInput",
            ],
          },
          {
            guard: "isFormValidAnd1cs",
            target: ".waiting_quote",
            actions: [
              // resetting everything both 1cs and not 1cs just in case
              {
                type: "setSlippage",
                params: ({ event }) => ({
                  slippageBasisPoints: event.params.slippageBasisPoints,
                }),
              },
              "sendToBackgroundQuoterRefPause",
              "sendToBackground1csQuoterRefPause",
              "cancelSendToBackgroundQuoterRefNewQuoteInput",
              "cancelSendToBackground1csQuoterRefNewQuoteInput",
              "clearQuote",
              "clearError",
              "clear1csError",
              {
                type: "updateFormValuesWithQuoteData",
              },
              "parseFormValues",
              "updateUIAmount",
              "sendToBackground1csQuoterRefNewQuoteInput",
            ],
          },
          // this exists in case both guards are false, so we can still set the slippage
          {
            actions: {
              type: "setSlippage",
              params: ({ event }) => ({
                slippageBasisPoints: event.params.slippageBasisPoints,
              }),
            },
          },
        ],
      },

      states: {
        idle: {},

        validating: {
          always: [
            {
              target: "waiting_quote",
              guard: "isFormValidAndNot1cs",
              actions: "sendToBackgroundQuoterRefNewQuoteInput",
            },
            {
              target: "waiting_quote",
              guard: "isFormValidAnd1cs",
              actions: "sendToBackground1csQuoterRefNewQuoteInput",
            },
            "idle",
          ],
        },

        waiting_quote: {
          on: {
            NEW_QUOTE: {
              target: "idle",
              actions: [
                {
                  type: "setQuote",
                  params: ({ event }) => event.params.quote,
                },
                "updateFormValuesWithQuoteData",
                "parseFormValues",
                "updateUIAmount",
              ],
              description: `should do the same as NEW_QUOTE on "editing" itself`,
            },
            NEW_1CS_QUOTE: {
              target: "idle",
              actions: [
                "process1csQuote",
                "updateFormValuesWithQuoteData",
                "parseFormValues",
                "updateUIAmount",
                "log1csNoLiquidity",
              ],
            },
          },
        },

        reviewing: {},
      },

      initial: "idle",
    },

    submitting: {
      invoke: {
        id: "swapRef",
        src: "swapActor",

        input: ({ context, event }) => {
          assertEvent(event, "submit")

          const quote = context.quote
          assert(quote !== null, "non valid quote")
          assert(quote.tag === "ok", "non valid quote")
          return {
            userAddress: event.params.userAddress,
            userChainType: event.params.userChainType,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              event.params.userAddress,
              event.params.userChainType
            ),
            referral: context.referral,
            slippageBasisPoints: context.slippageBasisPoints,
            nearClient: event.params.nearClient,
            intentOperationParams: {
              type: "swap" as const,
              tokensIn: getUnderlyingBaseTokenInfos(context.formValues.tokenIn),
              tokenOut: context.parsedFormValues.tokenOut,
              quote: quote.value,
            },
            appFeeRecipient: context.appFeeRecipient,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },

            actions: [
              "sendToBackgroundQuoterRefPause",
              "cancelSendToBackgroundQuoterRefNewQuoteInput",
              "resetParsedFormValueAmounts",
              "resetFormValueAmounts",
              "clearQuote",
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
              "emitEventIntentPublished",
            ],
          },
          {
            target: "editing.reviewing",

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

          actions: ({ event }) => {
            logger.error(event.error)
          },
        },
      },

      on: {
        CANCEL_REVIEW: {
          target: "editing",
        },
        NEW_QUOTE: {
          guard: {
            type: "isOk",
            params: ({ event }) => event.params.quote,
          },
          actions: [
            {
              type: "setQuote",
              params: ({ event }) => event.params.quote,
            },
            {
              type: "sendToSwapRefNewQuote",
              params: ({ event }) => event,
            },
          ],
        },
      },
    },

    submitting_1cs: {
      invoke: {
        id: "swapRef1cs",
        src: "swap1csActor",

        input: ({ context, event, self }) => {
          assertEvent(event, "submit")

          assert(
            context.parsedFormValues.amountIn != null &&
              context.parsedFormValues.amountIn.amount > 0n &&
              context.parsedFormValues.amountOut != null &&
              context.parsedFormValues.amountOut.amount > 0n &&
              context.is1cs &&
              context.quote &&
              context.quote.tag === "ok",
            "Invalid input for submitting_1cs"
          )
          assert(context.user?.identifier != null, "user address is not set")
          assert(context.user?.method != null, "user chain type is not set")
          const isExactInput =
            context.formValues.swapType === QuoteRequest.swapType.EXACT_INPUT
          // However knows how to access the child's state, please update this
          const snapshot = self.getSnapshot()
          const depositedBalanceRef:
            | ActorRefFrom<typeof depositedBalanceMachine>
            | undefined = snapshot.children.depositedBalanceRef
          const balances = balancesSelector(depositedBalanceRef?.getSnapshot())
          const amountInTokenBalance =
            balances[context.parsedFormValues.tokenIn.defuseAssetId]
          assert(
            amountInTokenBalance != null,
            "amountInTokenBalance is invalid"
          )
          return {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            amountOut: context.parsedFormValues.amountOut,
            amountInTokenBalance,
            swapType: context.formValues.swapType,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.user.identifier,
              context.user.method
            ),
            deadline: getMinDeadlineMs(
              10 * 60 * 1000, // 10 minutes
              (context.quote.value.timeEstimate ?? 0) * 1000 // timeEstimate in seconds, convert to milliseconds
            ),
            referral: context.referral,
            userAddress: event.params.userAddress,
            userChainType: event.params.userChainType,
            nearClient: event.params.nearClient,
            previousOppositeAmount: {
              amount: BigInt(
                isExactInput
                  ? context.quote.value.tokenDeltas[1][1]
                  : -context.quote.value.tokenDeltas[0][1]
              ),
              decimals: isExactInput
                ? context.parsedFormValues.tokenOut.decimals
                : context.parsedFormValues.tokenIn.decimals,
            },
            parentRef: self,
          }
        },

        onDone: [
          {
            target: "editing",
            guard: { type: "isOk", params: ({ event }) => event.output },

            actions: [
              "sendToBackground1csQuoterRefPause",
              "cancelSendToBackground1csQuoterRefNewQuoteInput",
              "resetParsedFormValueAmounts",
              "resetFormValueAmounts",
              "clearQuote",
              {
                type: "setIntentCreationResult",
                params: ({ event }) => event.output,
              },
              sendTo("depositedBalanceRef", ({ event }) => {
                assert(event.output.tag === "ok")
                if (event.output.value.depositAddress != null) {
                  return {
                    type: "ADD_ACCOUNT",
                    params: {
                      accountId: authIdentity.authHandleToIntentsUserId(
                        event.output.value.depositAddress,
                        "near"
                      ),
                    },
                  }
                }
              }),
              "emitEventIntentPublished",
            ],
          },
          {
            target: "editing.reviewing",

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

          actions: [
            ({ event }) => {
              logger.error(event.error)
            },
          ],
        },
      },

      on: {
        CANCEL_REVIEW: {
          target: "editing",
        },
        NEW_1CS_QUOTE: {
          actions: [
            "process1csQuote",
            "updateFormValuesWithQuoteData",
            "updateUIAmount",
            "log1csNoLiquidity",
          ],
        },
      },
    },
  },

  initial: "editing",
})
