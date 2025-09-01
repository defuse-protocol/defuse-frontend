import type { AuthMethod, authHandle } from "@defuse-protocol/internal-utils"
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
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../types/base"
import type { SwappableToken } from "../../types/swap"
import { assert } from "../../utils/assert"
import { parseUnits } from "../../utils/parse"
import {
  getAnyBaseTokenInfo,
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
import {
  type Output as SwapIntent1csMachineOutput,
  swapIntent1csMachine,
} from "./swapIntent1csMachine"
import {
  type Output as SwapIntentMachineOutput,
  swapIntentMachine,
} from "./swapIntentMachine"

function getTokenDecimals(token: BaseTokenInfo | UnifiedTokenInfo) {
  return isBaseToken(token) ? token.decimals : token.groupedTokens[0].decimals
}

export type Context = {
  user: null | authHandle.AuthHandle
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
  intentCreationResult:
    | SwapIntentMachineOutput
    | SwapIntent1csMachineOutput
    | null
  intentRefs: ActorRefFrom<typeof intentStatusMachine>[]
  tokenList: SwappableToken[]
  referral?: string
  slippageBasisPoints: number
  is1cs: boolean
  is1csFetching: boolean
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
      is1cs: boolean
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
      | {
          type: "NEW_1CS_QUOTE"
          params: {
            result:
              | {
                  ok: {
                    quote: {
                      amountIn?: string
                      amountOut?: string
                      deadline?: string
                    }
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
          const decimals = getTokenDecimals(context.formValues.tokenIn)
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
        assert(context.user?.identifier != null, "user address is not set")
        assert(context.user?.method != null, "user chain type is not set")
        return {
          type: "NEW_QUOTE_INPUT",
          params: {
            tokenIn: context.formValues.tokenIn,
            tokenOut: context.parsedFormValues.tokenOut,
            amountIn: context.parsedFormValues.amountIn,
            slippageBasisPoints: context.slippageBasisPoints,
            defuseUserId: authIdentity.authHandleToIntentsUserId(
              context.user.identifier,
              context.user.method
            ),
            deadline: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
            referral: context.referral,
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

        // For 1CS, we don't have intentDescription since it's a direct transfer
        // We only spawn intent status actors for regular swaps that have intentDescription
        if ("intentDescription" in output.value) {
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
        }

        // For 1CS (direct transfer), we don't need to track intent status
        return context.intentRefs
      },
    }),

    emitEventIntentPublished: emit(() => ({
      type: "INTENT_PUBLISHED" as const,
    })),

    // Process 1cs quote result
    process1csQuote: assign({
      quote: ({ event }) => {
        // Type guard to ensure the event is NEW_1CS_QUOTE
        if (event.type !== "NEW_1CS_QUOTE") {
          return null
        }

        const { result, tokenInAssetId, tokenOutAssetId } = event.params

        if ("ok" in result) {
          const quote: QuoteResult = {
            tag: "ok" as const,
            value: {
              quoteHashes: [],
              expirationTime:
                result.ok.quote.deadline ??
                new Date(Date.now() + 5 * 60 * 1000).toISOString(),
              tokenDeltas: [
                [tokenInAssetId, -BigInt(result.ok.quote.amountIn ?? "0")],
                [tokenOutAssetId, BigInt(result.ok.quote.amountOut ?? "0")],
              ] as [string, bigint][],
              appFee: [],
            },
          }
          return quote
        }

        const errorQuote: QuoteResult = {
          tag: "err" as const,
          value: {
            reason: "ERR_NO_QUOTES_1CS" as const,
          },
        }
        return errorQuote
      },
    }),

    set1csFetching: assign({
      is1csFetching: (_, value: boolean) => value,
    }),
  },
  guards: {
    isQuoteValid: ({ context }) => {
      return context.quote != null && context.quote.tag === "ok"
    },

    isQuoteValidAnd1cs: ({ context }) => {
      // For 1CS, we allow submission with valid form even without a quote since we fetch it during submission
      return (
        context.is1cs &&
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n
      )
    },

    isQuoteValidAndNot1cs: ({ context }) => {
      return (
        context.quote != null && context.quote.tag === "ok" && !context.is1cs
      )
    },

    isOk: (_, a: { tag: "err" | "ok" }) => a.tag === "ok",

    isFormValid: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n
      )
    },

    isFormValidAnd1cs: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n &&
        context.is1cs
      )
    },

    isFormValidAndNot1cs: ({ context }) => {
      return (
        context.parsedFormValues.amountIn != null &&
        context.parsedFormValues.amountIn.amount > 0n &&
        !context.is1cs
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaArgSwGIBJAOQBUBRcgfQGUKyyAZCgEQG0AGAXUVAwD2sPABc8AgHZ8QAD0RYArAoAcAOgCMAdgWcALJ04BOZZoBMCgDQgAnvMO7Nq5ac6b1B07oWfDAX19WqJi4hABCAIJM4SQAwhTUMQAS0QDibFy8SCCCwmKS0nIIAMy6RU6cCuqe+pwAbAqlVrYIWIamtaqGCkW1Pd6GRZpu-oHo2PgEEVGx8Ump6eqZ-EKi4lJZheqVqrWanEXK9prK6obqTfK96k6GZ66aRQq1h8ojIEHjhEwA8imkGdIcqt8htEL0bupdO1SrotEZNBcWvZDKpBuplBijkU6go3h8QgQfilvgBVMgArJAvLrUCFLCmdQdSFGcwM5QKTS1Z6I1q6FFojGHBzY+p4sYhVSQVYSKAEWA4ABGAFtRBTlrk1gVEOotKpNIY9PUzntlEVDIj3JxVHoSqZ2hzTIZnroxcF8JKINLZfLlarFoCVtStQh3KZrZ5Du0tAcHroefprpxTOyDtj9bplF5XZ8PV6CHgJBgcCI1dlA5rQS1zB1arc9FUzYdujySh1lBUXO4zj1OdmJVKxDKCCQKAB1agARRJ30opapFdp8mFnQG3WM+r0+x5tS8GmrO+86JM6j77oHBdlI-H6hitEn09nPADGpBi6r6jKsLN7WTZwa5psS5dyqJ4DzZY9TzwXNBygVQADc0AAGzwCA0Bggg53LV9ZHkIpPE6JNIQxeoDCKQZEVMY4dj5Q5jAzAYzVqSDoIveCkJQtCLww-1KSwmkcJaL8dlMQZa2eFQPwRQCQxUPVsQqJ03DtJMimY88ZTY5DUPQ9hTCWMsX34ulHjDTh2ztEjHlrSxpIUFcnVKWp3BOLR21xAJ3nFM9PRg1R0C9agAEccAEEQwGHMd7xnChMMM4NWlcVQFDadstBEkwDhbbZYVORl9geLZTDUnzWP8mCgpCsKIuvW8osffT52wukdA6fRkvaY5jnMHkXEcLQdQ-ZM9gZJiPPxd0fRVER0IgSQwFUAs4IEABreaPgAJTAAAzWLgSMsE2j1DkBihQxjmS2oerwnZ2VDJztDIx5mMm0QZrmhaJCW1bVA27b2B49U9uDM1rlKYxkx6Eo6naHllA6VdOUqVlHjw57FSm9CwAAJyxgQsdUDBELQra8aVH6xk2nan14uLKy8Pq6idJz2VqCoetuToHgaZx+q8XQXTGryoJe6auKvOqYupwGg0rZw1GTDl2Xotxjm3JMbsUqFPA-My0d9UWZWodQAGNYAIWaJHmxaVrWintpN2Bdplt9njDNx3G5hw3FuRFsTUJNunbCoWVrPWMYvI3TfN97re+36tod-6Gr44GTlRNoGL5J0zSk5pTtUfQTnsJQ4dqO0w9eiOHYIbHcfxwnidJ8nMEpxOpYMoG6eus520GfZ2QNIoLS6PUG2PR0OTMdzRjdYX0crw3q-Fm87ynaKnYXASuhRdF+dL1xIRh6SsChVFGSdaF+bw7R-A8iQBAgOBpHGvBn07t8sEtMp2tSswY0y4+pprhlyeKdUSUJNDFS9G-Z2AlWhKCSilTgaV-7KHjOyToOpB4gL9tPTys8WIaRQohMAMDN50npgXPC7IRKnEomddmVoGSNnMF+fmAwoG+QQlpTiMoyFNXkOiRwJRnCOgeL0cwegeQNALvUFw9RehQlyqNGeOZ1KwTKhHYKoVSE03fnA54ZRJJwxEqUX+iJdjp35lsVwmY4bJQrgbKA-D9oIGeFaMytw6J2jhkUc4x8+aohOEoO0lQ2iOPKg7FxwZnhqBESJBJHJkFoOkgNdO0Yy5B2QTfW+QA */
  id: "swap-ui",

  context: ({ input }) => ({
    user: null,
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
    slippageBasisPoints: 30_000, // 3%
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
      entry: [
        "clearQuote",
        {
          type: "set1csFetching",
          params: true,
        },
      ],
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
            tokenIn: context.formValues.tokenIn,
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
              send: (event: {
                type: "NEW_1CS_QUOTE"
                params?: unknown
              }) => {
                // biome-ignore lint/suspicious/noExplicitAny: necessary for dynamic event casting
                self.send(event as any)
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
            {
              type: "set1csFetching",
              params: false,
            },
          ],
        },
      },

      on: {
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
    },
  },

  initial: "editing",
})
