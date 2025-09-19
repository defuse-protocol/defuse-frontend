import { AuthMethod, type authHandle } from "@defuse-protocol/internal-utils"
import { authIdentity } from "@defuse-protocol/internal-utils"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { APP_FEE_BPS, APP_FEE_RECIPIENT } from "@src/utils/environment"
import type { providers } from "near-api-js"
import {
  type ActorRefFrom,
  assertEvent,
  assign,
  emit,
  sendTo,
  setup,
  spawnChild,
} from "xstate"
import { logger } from "../../logger"
import type { QuoteResult } from "../../services/quoteService"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import type { TokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import { parseUnits } from "../../utils/parse"
import {
  getAnyBaseTokenInfo,
  getTokenMaxDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../utils/tokenUtils"
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

import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import { intentStatusMachine } from "./intentStatusMachine"
import { oneClickStatusMachine } from "./oneClickStatusMachine"
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
  }
  parsedFormValues: {
    tokenIn: BaseTokenInfo
    tokenOut: BaseTokenInfo
    amountIn: TokenValue | null
  }
  intentCreationResult:
    | SwapIntentMachineOutput
    | SwapIntent1csMachineOutput
    | null
  intentRefs: (
    | ActorRefFrom<typeof intentStatusMachine>
    | ActorRefFrom<typeof oneClickStatusMachine>
  )[]
  tokenList: TokenInfo[]
  referral?: string
  slippageBasisPoints: number
  is1cs: boolean
  is1csFetching: boolean
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
    },
    context: {} as Context,
    events: {} as
      | {
          type: "input"
          params: Partial<{
            tokenIn: TokenInfo
            tokenOut: TokenInfo
            amountIn: string
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
            result:
              | {
                  ok: {
                    quote: {
                      amountIn: string
                      amountOut: string
                      deadline?: string
                    }
                    appFee: [string, bigint][]
                  }
                }
              | { err: string }
            tokenInAssetId: string
            tokenOutAssetId: string
          }
        }
      | BackgroundQuoterParentEvents
      | Background1csQuoterParentEvents
      | DepositedBalanceEvents
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
    intentStatusActor: intentStatusMachine,
    oneClickStatusActor: oneClickStatusMachine,
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
          }>
        }
      ) => ({
        ...context.formValues,
        ...data,
      }),
    }),
    parseFormValues: assign({
      parsedFormValues: ({ context }) => {
        const tokenIn = getAnyBaseTokenInfo(context.formValues.tokenIn)
        const tokenOut = getAnyBaseTokenInfo(context.formValues.tokenOut)

        try {
          const decimals = context.is1cs
            ? getTokenDecimals(context.formValues.tokenIn)
            : getTokenMaxDecimals(context.formValues.tokenIn)
          return {
            tokenIn,
            tokenOut,
            amountIn: {
              amount: parseUnits(context.formValues.amountIn, decimals),
              decimals,
            },
          }
        } catch {
          return {
            tokenIn,
            tokenOut,
            amountIn: null,
          }
        }
      },
    }),
    updateUIAmountOut: () => {
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
    setIntentCreationResult: assign({
      intentCreationResult: (
        _,
        value: SwapIntentMachineOutput | SwapIntent1csMachineOutput
      ) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),
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
        const balances = depositedBalanceRef?.getSnapshot().context.balances

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
              APP_FEE_RECIPIENT,
              context.user
            ),
          },
        }
      }
    ),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefPause: sendTo("backgroundQuoterRef", {
      type: "PAUSE",
    }),
    sendToBackground1csQuoterRefNewQuoteInput: sendTo(
      "background1csQuoterRef",
      ({ context }): Background1csQuoterEvents => {
        assert(context.parsedFormValues.amountIn != null, "amountIn is not set")

        const user =
          context.user ??
          ({ identifier: "check-price", method: AuthMethod.Near } as const)

        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              user.identifier,
              user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            userAddress: user.identifier,
            userChainType: user.method,
          },
        }
      }
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

    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToSwapRefNewQuote: sendTo(
      "swapRef",
      (_, event: BackgroundQuoterParentEvents) => event
    ),

    spawnIntentStatusActor: assign({
      intentRefs: (
        { context, spawn, self },
        output: SwapIntentMachineOutput | SwapIntent1csMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

        if (context.is1cs && "depositAddress" in output.value) {
          const swapDescription = output.value.intentDescription as Extract<
            typeof output.value.intentDescription,
            { type: "swap" }
          >
          const oneClickRef = spawn("oneClickStatusActor", {
            id: `${ONE_CLICK_PREFIX}${output.value.depositAddress}`,
            input: {
              parentRef: self,
              depositAddress: output.value.depositAddress,
              tokenIn: context.formValues.tokenIn,
              tokenOut: context.formValues.tokenOut,
              totalAmountIn: swapDescription.totalAmountIn,
              totalAmountOut: swapDescription.totalAmountOut,
            },
          })

          return [oneClickRef, ...context.intentRefs]
        }

        const intentRef = spawn("intentStatusActor", {
          id: `intent-${output.value.intentHash}`,
          input: {
            parentRef: self,
            intentHash: output.value.intentHash,
            tokenIn: context.formValues.tokenIn,
            tokenOut: context.formValues.tokenOut,
            intentDescription: output.value.intentDescription,
          },
        })

        return [intentRef, ...context.intentRefs]
      },
    }),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

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

    set1csFetching: assign({
      is1csFetching: (_, value: boolean) => value,
    }),
  },
  guards: {
    isQuoteValidAndNot1cs: ({ context }) => {
      return (
        !context.is1cs && context.quote != null && context.quote.tag === "ok"
      )
    },
    isQuoteValidAnd1cs: ({ context }) => {
      return (
        context.is1cs &&
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n
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
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n &&
        context.is1cs
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaArgSwGIBJAOQBUBRcgfQGUKyyAZCgEQG0AGAXUVAwD2sPABc8AgHZ8QAD0RYArAoAcAOgCMAdgWcALJ04BOZZoBMCgDQgAnvMO7Nq5ac6b1B07oWfDAX19WqJi4hADyJBTUAMJMRFEA0nQMzGxcvEgggsJiktJyCOrqymqmyl4KhgDMAGwu2la2CFj2nBrKnEWVup7Vxbr+gejY+AQAQgCCTOMkUZFRABLTAOKpPNJZouJSGfldlU6cCuqe+pzVCrqVDXam1aqGCjU13lWabgMgQcOEE1Mzc4sSCsOOp0vwhJtcjtEOojqpqppOJVlPZNMp1IZ1NcmtVKuonIZMa5NJUFL1jB8viECExQktSGl1hCcttQPlcQT1N1qpddFojJpsc1dIZVJU3MUUQ5KmcFJShtTaUtQgBVMiMjIbFl5eSmdR3LlGcx65QKTTVXpC+yi8VFYqomXneXBfCqSCbCRQAiwHAAIwAtqINeDslsdQUtKpNIY9OdMYjlJVDNj3K09F1TLczaZDL1+gFPgrXe6xJ7vX7AyJ2KCmaGoWyYZxTKom7oUbctMiSbohfp8U3TciZdG215nd83RAPV68BIMDgq2tNcyw9CmuY7tVCXpjkmUY8hV07u1vB0jOoaubxyFJ9OCBEAOrUACKKtClGDmRX9dk8ml9yqR5jGjPQkSFHkFA0DcIJNEx1GvYsp1LL1H2odQoloF83w-JcQ0hVlf3XC9VD5JNblKTELmTGx5AgqCyRgu13gLKlEOnVQADc0AAGzwCA0GQghPy1VcGyaSpPHuJsuWKc4DEqcVsVMNF4RFFFjDbKok2qBC8FvZDOJ4viBNnL1qzBL86wI-IsFI+FTHFLdehUC9BRogoVCjGVDlzNxMybSpdP00zDN4-jBPYUwLJEn8bNJZtOHaTM5NJLdLHcyDCVzS5qncdEtBPIKSxC9Bp2oABHHABBEMB7woJ9X3fChhO-ay7FcVQKlKDozC7ZFDzhPkMX1JESVhUwiqQkq0DKyrqtq1D0MwxqcOi1rw0UM4SJ8240TRcwhTqDQ3EKCSTGknSWKLPSfQDURBIgSQwFUWcOIEABrZ6vgAJTAAAzFqrPDLdm20aMM0MNEKmqQ6JPhU13A7bQFNJILbsrB6npeiQ3s+1Qfv+8za3w8Mk3xS5jFKJ59FqGH3KwZQ7kA80jmNUkJLRit7tMggwAAJz5gQ+dUDBuIEv6hf9fGhl+gHcMskm1y8Rx3Cc3LTWqQ5DsJe4SQuZwtC5C580GF0bq5kRBNQlbmvlmK2oQZwSlNKHNLcNFwKbeHfO6TwL0Szm7st0y0IAY1gAhHokZ7Xo+r6Zf+9Rw8BxWxN6UHCkOUc3gxajGhlNQm0edpDiNLdA4xkOk4jqOY5xuPpcwWXq6J5cgbXZF8TIrSRVzJM3MabpRX0dF7CURnagmq6zfxi3kLDiP+cF4XRfFyXG4wZvk7t9albhzF2nFJFTRjK53IxSC-K7Y4HjecwK+5z0F7qp8lqwpqU+1NcHlFIpdDbC0rguS3F7M2PETlbj-0uMpOUHwJACAgHAaQrE8DEy-mJLAqZ9hdXaFoByJh+r00TPiWoZojBkT1EoSa040GiUIs0JQnVDDdTwX1ZQvZTT3EKDGDoFpSLKGoQZPi3EwC0Nin+M0JEzreDxMw6MA9dQxlUHqPc5hSL-yqIIkKXEwomU9GIh2mCTBijbJmSGTxzB6CFBcEi5wXDnFxN0Yal1TYTmKp6VQpV55zRqgYjavR9iuUZg5S4uCFEIARGKewfIdBogARUB+wd9Ft1ToRXoaZ1IaUzIzPEvYbGdyUJmI4zDEnz2rn4tcvQ1BdGcBJCSZCigpkKFEzstQS49Vgf4IAA */
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
    },
    parsedFormValues: {
      tokenIn: getAnyBaseTokenInfo(input.tokenIn),
      tokenOut: getAnyBaseTokenInfo(input.tokenOut),
      amountIn: null,
    },
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
    referral: input.referral,
    slippageBasisPoints: 10_000, // 1%
    is1cs: input.is1cs,
    is1csFetching: false,
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
  },

  states: {
    editing: {
      on: {
        submit: [
          {
            target: "submitting_1cs",
            guard: "isQuoteValidAnd1cs",
            actions: "clearIntentCreationResult",
          },
          {
            target: "submitting",
            guard: "isQuoteValidAndNot1cs",
            actions: "clearIntentCreationResult",
          },
        ],

        input: {
          target: ".validating",
          actions: [
            "clearQuote",
            "updateUIAmountOut",
            "sendToBackgroundQuoterRefPause",
            "sendToBackground1csQuoterRefPause",
            "clearError",
            "clear1csError",
            {
              type: "setFormValues",
              params: ({ event }) => ({ data: event.params }),
            },
            "parseFormValues",
          ],
        },

        NEW_QUOTE: {
          actions: [
            {
              type: "setQuote",
              params: ({ event }) => event.params.quote,
            },
            "updateUIAmountOut",
          ],
        },

        NEW_1CS_QUOTE: {
          actions: [
            "process1csQuote",
            "updateUIAmountOut",
            {
              type: "set1csFetching",
              params: false,
            },
          ],
        },
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
                "updateUIAmountOut",
              ],
              description: `should do the same as NEW_QUOTE on "editing" itself`,
            },
            NEW_1CS_QUOTE: {
              target: "idle",
              actions: [
                "process1csQuote",
                "updateUIAmountOut",
                {
                  type: "set1csFetching",
                  params: false,
                },
              ],
            },
          },
        },
      },

      initial: "idle",
      entry: "updateUIAmountOut",
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

          actions: ({ event }) => {
            logger.error(event.error)
          },
        },
      },

      on: {
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
      entry: ["sendToBackground1csQuoterRefPause"],
      invoke: {
        id: "swapRef1cs",
        src: "swap1csActor",

        input: ({ context, event, self }) => {
          assertEvent(event, "submit")

          assert(
            context.parsedFormValues.amountIn != null,
            "amountIn is not set"
          )
          assert(context.user?.identifier != null, "user address is not set")
          assert(context.user?.method != null, "user chain type is not set")

          return {
            tokenIn: context.parsedFormValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.user.identifier,
              context.user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            referral: context.referral,
            userAddress: event.params.userAddress,
            userChainType: event.params.userChainType,
            nearClient: event.params.nearClient,
            parentRef: {
              send: (event: Background1csQuoterParentEvents) => {
                self.send(event)
              },
            },
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

          actions: [
            ({ event }) => {
              logger.error(event.error)
            },
          ],
        },
      },

      on: {
        NEW_1CS_QUOTE: {
          actions: ["process1csQuote", "updateUIAmountOut"],
        },
      },
    },
  },

  initial: "editing",
})
