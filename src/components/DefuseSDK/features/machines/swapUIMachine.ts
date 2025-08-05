import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { APP_FEE_BPS } from "@src/utils/environment"
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
import type { AuthMethod } from "../../types/authHandle"
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../types/base"
import type { SwappableToken } from "../../types/swap"
import { assert } from "../../utils/assert"
import { authHandleToIntentsUserId } from "../../utils/authIdentity"
import { parseUnits } from "../../utils/parse"
import {
  getAnyBaseTokenInfo,
  getTokenMaxDecimals,
  getUnderlyingBaseTokenInfos,
} from "../../utils/tokenUtils"
import {
  type Events as BackgroundQuoterEvents,
  type ParentEvents as BackgroundQuoterParentEvents,
  backgroundQuoterMachine,
} from "./backgroundQuoterMachine"
import {
  type BalanceMapping,
  type Events as DepositedBalanceEvents,
  depositedBalanceMachine,
} from "./depositedBalanceMachine"
import { intentStatusMachine } from "./intentStatusMachine"
import {
  type Output as SwapIntentMachineOutput,
  swapIntentMachine,
} from "./swapIntentMachine"

export type Context = {
  error: Error | null
  quote: QuoteResult | null
  formValues: {
    tokenIn: SwappableToken
    tokenOut: SwappableToken
    amountIn: string
  }
  parsedFormValues: {
    tokenOut: BaseTokenInfo
    amountIn: TokenValue | null
  }
  intentCreationResult: SwapIntentMachineOutput | null
  intentRefs: ActorRefFrom<typeof intentStatusMachine>[]
  tokenList: SwappableToken[]
  referral?: string
  slippageBasisPoints: number
}

type PassthroughEvent = {
  type: "INTENT_SETTLED"
  data: {
    intentHash: string
    txHash: string
    tokenIn: BaseTokenInfo | UnifiedTokenInfo
    tokenOut: BaseTokenInfo | UnifiedTokenInfo
  }
}

type EmittedEvents = PassthroughEvent | { type: "INTENT_PUBLISHED" }

export const swapUIMachine = setup({
  types: {
    input: {} as {
      tokenIn: SwappableToken
      tokenOut: SwappableToken
      tokenList: SwappableToken[]
      referral?: string
    },
    context: {} as Context,
    events: {} as
      | {
          type: "input"
          params: Partial<{
            tokenIn: SwappableToken
            tokenOut: SwappableToken
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
      | BackgroundQuoterParentEvents
      | DepositedBalanceEvents
      | PassthroughEvent,

    emitted: {} as EmittedEvents,

    children: {} as {
      depositedBalanceRef: "depositedBalanceActor"
      swapRef: "swapActor"
    },
  },
  actors: {
    backgroundQuoterActor: backgroundQuoterMachine,
    depositedBalanceActor: depositedBalanceMachine,
    swapActor: swapIntentMachine,
    intentStatusActor: intentStatusMachine,
  },
  actions: {
    setFormValues: assign({
      formValues: (
        { context },
        {
          data,
        }: {
          data: Partial<{
            tokenIn: SwappableToken
            tokenOut: SwappableToken
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
        const tokenOut = getAnyBaseTokenInfo(context.formValues.tokenOut)

        try {
          const decimals = getTokenMaxDecimals(context.formValues.tokenIn)
          return {
            tokenOut,
            amountIn: {
              amount: parseUnits(context.formValues.amountIn, decimals),
              decimals,
            },
          }
        } catch {
          return {
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
    setIntentCreationResult: assign({
      intentCreationResult: (_, value: SwapIntentMachineOutput) => value,
    }),
    clearIntentCreationResult: assign({ intentCreationResult: null }),
    passthroughEvent: emit((_, event: PassthroughEvent) => event),
    spawnBackgroundQuoterRef: spawnChild("backgroundQuoterActor", {
      id: "backgroundQuoterRef",
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
              context.formValues.tokenOut
            ),
          },
        }
      }
    ),
    // Warning: This cannot be properly typed, so you can send an incorrect event
    sendToBackgroundQuoterRefPause: sendTo("backgroundQuoterRef", {
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
        output: SwapIntentMachineOutput
      ) => {
        if (output.tag !== "ok") return context.intentRefs

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
  },
  guards: {
    isQuoteValid: ({ context }) => {
      return context.quote != null && context.quote.tag === "ok"
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",

    isFormValid: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaArgSwGIBJAOQBUBRcgfQGUKyyAZCgEQG0AGAXUVAwD2sPABc8AgHZ8QAD0RYArAoAcAOgCMAdgWcALJ04BOZZoBMCgDQgAnvMO7Nq5ac6b1B07oWfDAX19WqJi4hABCAIJM4SQAwhTUMQAS0QDibFy8SCCCwmKS0nIIAMxFCk5GygBsmpqGnJUKlZVWtghYhpWmqtWG6lWuupWcRer+gejY+ARMAPIppBnSOaLiUlmFlUVOvbqmlbpFulpGmi12uoaqRW7Kt-aaRfUKYyBBk4SzKTMAqmSLWcs8mtQIUsKZ1JUNPpDOZwcoFJomsozm17Jdrn07g5Hg0Xm8QqpICsJFACLAcAAjAC2on+-CEK3y60Q6i0qlq7lMhz6Sm0KKwRUMl06HSFpmURiafgCrwmBKJYhJBDwEgwOBEdOyDKBBXkezK4PUOgUEKM4uu-Oul3UB046iKm3tQsqeLl+EJEGJpJIFAA6tQAIrfGaUTWA1a6trY1RC0qCkx1fRFfn7MrqcxNLxwkyjGX490KlVQVQANzQABs8BA0IrSRBJGBVCqSwIANaN-N4D1e0sVqs1osIZsCADGA8kGTD2ojzLaKi2pkMCl0yncVWUu2aNnk2iuCKM6nsnCUxiKruCBc9td7lertYI9YkjeH7dUne717Lt4HJKHEhbY5ApO6iZPSuQziC8gqGUwzHnaK4SoM-I2l0drKEUhq6IMaEunmbpdoWJKqOgXrUAAjjgAgiGABA+v6QYhhQU7gUykGoq4qgKDCEpaFyJhFMi25tKU6iqEch6mtcIzeOe7xvpSNIiPej7Pv+bYdhMABKYAAGbMYywKyIg4mqIuq5YVh66sqcQkCpwXSDBu66HA6RyaLJBLktSoj3mAABOfkCH5qgYOWNY6UFVJvlpun6Tqs4HJchoKCMDRVPYpTIfs7K7PYJq7Hsmi7B57peYp950YGwahjwSzTqxRkIAcMG9Ky4p6Mcli2cujgOouDroZU9idP4MoSAIEBwNInZ1Sxhmgu4wycdxdpmAJDyCa0WASgaRWuJoG5JiMJUEVeRazQZkbtEoy3tbx60CfyJoLkuVpHEMiKmCdH5Fk2EDlmAF3xWxWBeI4Bzit4IwwrUNlbYunCmU6zjLvaWGGGeeEXqdPZfv2tZAxBjVgoKVxmC4CLrkKtz8jUTi1BjpgHXx9qY+M2M-URJG1uRlHUYTDWgoiiO3Me+7wrsEJPboYkNC4DSbJLvS4ezcllT550AvV82IAJZTvfZzistUCL8kcMGmOY6Zco8aO4f4QA */
  id: "swap-ui",

  context: ({ input }) => ({
    error: null,
    quote: null,
    formValues: {
      tokenIn: input.tokenIn,
      tokenOut: input.tokenOut,
      amountIn: "",
    },
    parsedFormValues: {
      tokenOut: getAnyBaseTokenInfo(input.tokenOut),
      amountIn: null,
    },
    intentCreationResult: null,
    intentRefs: [],
    tokenList: input.tokenList,
    referral: input.referral,
    slippageBasisPoints: 10_000, // 1%
  }),

  entry: ["spawnBackgroundQuoterRef", "spawnDepositedBalanceRef"],

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

    BALANCE_CHANGED: {
      guard: "isFormValid",
      actions: "sendToBackgroundQuoterRefNewQuoteInput",
    },

    LOGIN: {
      actions: {
        type: "relayToDepositedBalanceRef",
        params: ({ event }) => event,
      },
    },
    LOGOUT: {
      actions: {
        type: "relayToDepositedBalanceRef",
        params: ({ event }) => event,
      },
    },
  },

  states: {
    editing: {
      on: {
        submit: {
          target: "submitting",
          guard: "isQuoteValid",
          actions: "clearIntentCreationResult",
        },

        input: {
          target: ".validating",
          actions: [
            "clearQuote",
            "updateUIAmountOut",
            "sendToBackgroundQuoterRefPause",
            "clearError",
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
      },

      states: {
        idle: {},

        validating: {
          always: [
            {
              target: "waiting_quote",
              guard: "isFormValid",
              actions: "sendToBackgroundQuoterRefNewQuoteInput",
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
            defuseUserId: authHandleToIntentsUserId(
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
  },

  initial: "editing",
})
