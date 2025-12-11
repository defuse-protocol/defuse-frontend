import {
  errors,
  prepareBroadcastRequest,
  withTimeout,
} from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import {
  type GenerateIntentResponse,
  type MultiPayload,
  QuoteRequest,
} from "@defuse-protocol/one-click-sdk-typescript"
import { retry } from "@lifeomic/attempt"
import {
  generateIntent as generateIntentApi,
  getQuote as get1csQuoteApi,
  submitIntent as submitIntentApi,
} from "@src/components/DefuseSDK/features/machines/1cs"
import type { ParentEvents as Background1csQuoterParentEvents } from "@src/components/DefuseSDK/features/machines/background1csQuoterMachine"
import { AUTH_METHOD_TO_STANDARD } from "@src/components/DefuseSDK/utils/intentStandards"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import { assign, fromPromise, log, setup } from "xstate"
import { wrapPayloadAsWalletMessage } from "../../core/messages"
import type { BaseTokenInfo } from "../../types/base"
import { assert } from "../../utils/assert"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"
import {
  type ErrorCodes as PublicKeyVerifierErrorCodes,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"
import type { IntentDescription } from "./swapIntentMachine"

type Context = {
  input: Input
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  quote1csResult:
    | {
        ok: {
          quote: {
            amountIn: string
            amountOut: string
            deadline?: string
            depositAddress?: string
          }
          appFee: [string, bigint][]
        }
      }
    | { err: string; originalRequest?: QuoteRequest | undefined }
    | null
  generateIntentResponse: GenerateIntentResponse | null
  walletMessage: walletMessage.WalletMessage | null
  signature: walletMessage.WalletSignatureResult | null
  intentHash: string | null
  error: null | {
    tag: "err"
    value:
      | {
          reason:
            | "ERR_1CS_QUOTE_FAILED"
            | "ERR_NO_DEPOSIT_ADDRESS"
            | "ERR_GENERATE_INTENT_FAILED"
            | "ERR_SUBMIT_INTENT_FAILED"
            | "ERR_USER_DIDNT_SIGN"
            | "ERR_PUBKEY_EXCEPTION"
            | "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE"
            | WalletErrorCode
            | PublicKeyVerifierErrorCodes
          error: Error | null
        }
      | {
          reason: "ERR_SUBMIT_INTENT_FAILED"
          server_reason: string
        }
  }
}

type Input = {
  tokenIn: BaseTokenInfo
  tokenOut: BaseTokenInfo
  amountInTokenBalance: bigint
  swapType: QuoteRequest.swapType
  slippageBasisPoints: number
  defuseUserId: string
  deadline: string
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  amountIn: { amount: bigint; decimals: number }
  amountOut: { amount: bigint; decimals: number }
  previousOppositeAmount: { amount: bigint; decimals: number }
  parentRef?: {
    send: (
      event:
        | Background1csQuoterParentEvents
        | {
            type: "PRICE_CHANGE_CONFIRMATION_REQUEST"
            params: {
              newOppositeAmount: { amount: bigint; decimals: number }
              previousOppositeAmount: { amount: bigint; decimals: number }
            }
          }
    ) => void
  }
}

export type Output =
  | NonNullable<Context["error"]>
  | {
      tag: "ok"
      value: {
        intentHash: string
        depositAddress: string
        intentDescription: IntentDescription
      }
    }

export const swapIntent1csMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    output: {} as Output,
  },
  actions: {
    setError: assign({
      error: (_, error: NonNullable<Context["error"]>["value"]) => ({
        tag: "err" as const,
        value: error,
      }),
    }),
    logError: (_, params: { error: unknown }) => {
      logger.error(params.error)
    },
    set1csQuoteResult: assign({
      quote1csResult: (_, result: NonNullable<Context["quote1csResult"]>) =>
        result,
    }),
    setGenerateIntentResponse: assign({
      generateIntentResponse: (_, response: GenerateIntentResponse) => response,
    }),
    setWalletMessage: assign({
      walletMessage: (_, walletMessage: walletMessage.WalletMessage) =>
        walletMessage,
    }),
    setSignature: assign({
      signature: (_, signature: walletMessage.WalletSignatureResult | null) =>
        signature,
    }),
    setIntentHash: assign({
      intentHash: (_, intentHash: string) => intentHash,
    }),

    notifyQuoteResult: ({ context }) => {
      if (context.quote1csResult) {
        const tokenInAssetId = context.input.tokenIn.defuseAssetId
        const tokenOutAssetId = context.input.tokenOut.defuseAssetId

        context.input.parentRef?.send({
          type: "NEW_1CS_QUOTE",
          params: {
            result: context.quote1csResult,
            quoteInput: {
              tokenIn: context.input.tokenIn,
              tokenOut: context.input.tokenOut,
              amount:
                context.input.swapType === QuoteRequest.swapType.EXACT_INPUT
                  ? context.input.amountIn
                  : context.input.amountOut,
              swapType: context.input.swapType,
              slippageBasisPoints: context.input.slippageBasisPoints,
              defuseUserId: context.input.defuseUserId,
              deadline: context.input.deadline,
              userAddress: context.input.userAddress,
              userChainType: context.input.userChainType,
            },
            tokenInAssetId,
            tokenOutAssetId,
          },
        })
      }
    },
  },
  actors: {
    fetch1csQuoteActor: fromPromise(
      async ({ input }: { input: Input & { userChainType: AuthMethod } }) => {
        return get1csQuoteApiWithRetry({
          dry: false,
          slippageTolerance: Math.round(input.slippageBasisPoints / 100),
          originAsset: input.tokenIn.defuseAssetId,
          destinationAsset: input.tokenOut.defuseAssetId,
          amount: (input.swapType === QuoteRequest.swapType.EXACT_INPUT
            ? input.amountIn.amount
            : input.amountOut.amount
          ).toString(),
          deadline: input.deadline,
          userAddress: input.userAddress,
          authMethod: input.userChainType,
          swapType: input.swapType,
        })
      }
    ),
    generateIntentActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          depositAddress: string
          defuseUserId: string
          userChainType: AuthMethod
        }
      }): Promise<GenerateIntentResponse> => {
        const standard = AUTH_METHOD_TO_STANDARD[input.userChainType]
        const result = await generateIntentApi({
          depositAddress: input.depositAddress,
          signerId: input.defuseUserId,
          standard,
        })

        if ("err" in result) {
          throw new Error(result.err)
        }

        return result.ok
      }
    ),
    signMessage: fromPromise(
      async (_: {
        input: walletMessage.WalletMessage
      }): Promise<walletMessage.WalletSignatureResult | null> => {
        throw new Error("signMessage actor must be provided by the parent")
      }
    ),
    publicKeyVerifierActor: publicKeyVerifierMachine,
    submitIntentActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          signatureData: walletMessage.WalletSignatureResult
          userInfo: { userAddress: string; userChainType: AuthMethod }
        }
      }): Promise<
        { tag: "ok"; value: string } | { tag: "err"; value: { reason: string } }
      > => {
        // Transform WalletSignatureResult to MultiPayload format
        const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
          input.signatureData,
          input.userInfo
        ) as MultiPayload

        const result = await submitIntentApi({ signedIntent })

        if ("err" in result) {
          return { tag: "err", value: { reason: result.err } }
        }

        // The response should contain the intent hash
        return { tag: "ok", value: result.ok.intentHash ?? "" }
      }
    ),
  },
  guards: {
    isSigned: (_, params: walletMessage.WalletSignatureResult | null) =>
      params != null,
    isTrue: (_, params: boolean) => params,
    isOk: (_, params: { tag: "ok" } | { tag: "err" }) => params.tag === "ok",
    isQuoteSuccess: ({ context }) => {
      return (
        context.quote1csResult != null &&
        "ok" in context.quote1csResult &&
        context.quote1csResult.ok.quote.depositAddress != null
      )
    },
    insufficientBalanceForExactOutQuote: ({ context }) => {
      if (context.input.swapType === QuoteRequest.swapType.EXACT_INPUT)
        return false

      if (
        context.quote1csResult == null ||
        !("ok" in context.quote1csResult) ||
        context.quote1csResult.ok.quote.amountIn == null
      ) {
        return false
      }

      return (
        BigInt(context.quote1csResult.ok.quote.amountIn) >
        context.input.amountInTokenBalance
      )
    },
    isWorseThanPrevious: ({ context }) => {
      const prev = context.input.previousOppositeAmount
      if (
        context.quote1csResult == null ||
        !("ok" in context.quote1csResult) ||
        context.quote1csResult.ok.quote.amountOut == null ||
        context.quote1csResult.ok.quote.amountIn == null
      ) {
        return false
      }
      const isExactInput =
        context.input.swapType === QuoteRequest.swapType.EXACT_INPUT
      const amount = BigInt(
        isExactInput
          ? context.quote1csResult.ok.quote.amountOut
          : context.quote1csResult.ok.quote.amountIn
      )
      return isExactInput ? amount < prev.amount : amount > prev.amount
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaAlgOwBcxCsBGAY1gDoAxMA8gC3ygtgEUBXAeyIGII3PGCr4AbtwDWI1JlyFiBMpVr0mLNl15gE47uTQEcQgNoAGALrmLiUBm6wcRobZAAPRACYAnAFYqACzewQAcIQDMZt4hZgBssQA0IACeXuGeVOG+pAEA7OEhpLmkwQGxAL7lSbLY+EQkbKoMzHislFr8YABOXdxdVBgANoYAZn0AtlQ18vVKjXTNGu08RLp4EgbOeNbWrvaOW64eCD7+QaERUTHxSakIhYGhsblhvrkBnr6+ldXotQoNFQANTQgxwEEMLA6YD4uyQIH2TmMeCOiFyZhCVDMZlyLxeZlInk+uVuiACRSopF8sVIsTM2Q+sWpPxA0zqimU1BBYIhRla0NhpBs8MRh3hx3RmOxuJC+MJxNJCGeUs+3lihR8uW8tJZbIBc2BoPBkP5KxhJk8wrsDiRLnFaIxWJxeJi8vis84ViVHRPgCIX9ZkisXCur+Mw5OmPf5Zy5dLKLJ5HvCdI1P0W */
  id: "swap-intent-1cs",

  context: ({ input }) => ({
    input,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
    nearClient: input.nearClient,
    quote1csResult: null,
    generateIntentResponse: null,
    walletMessage: null,
    signature: null,
    intentHash: null,
    error: null,
  }),

  initial: "Fetching1csQuote",

  output: ({ context }): Output => {
    if (context.intentHash != null) {
      assert(
        context.quote1csResult != null &&
          "ok" in context.quote1csResult &&
          context.quote1csResult.ok.quote.depositAddress != null,
        "Deposit address must be set when intent hash is available"
      )

      return {
        tag: "ok",
        value: {
          intentHash: context.intentHash,
          depositAddress: context.quote1csResult.ok.quote.depositAddress,
          intentDescription: {
            type: "swap",
            totalAmountIn: {
              amount: BigInt(context.quote1csResult.ok.quote.amountIn ?? "0"),
              decimals: context.input.tokenIn.decimals,
            },
            totalAmountOut: {
              amount: BigInt(context.quote1csResult.ok.quote.amountOut ?? "0"),
              decimals: context.input.tokenOut.decimals,
            },
            depositAddress: context.quote1csResult.ok.quote.depositAddress,
          },
        },
      }
    }

    if (context.error != null) {
      return context.error
    }

    throw new Error("Unexpected output state")
  },

  states: {
    Fetching1csQuote: {
      invoke: {
        src: "fetch1csQuoteActor",
        input: ({ context }) => context.input,
        onDone: {
          target: "ValidatingQuote",
          actions: [
            {
              type: "set1csQuoteResult",
              params: ({ event }) => event.output,
            },
            "notifyQuoteResult",
          ],
        },
        onError: {
          target: "Error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => {
                return {
                  reason: "ERR_1CS_QUOTE_FAILED",
                  error:
                    event.error instanceof Error
                      ? event.error
                      : new Error(String(event.error)),
                }
              },
            },
          ],
        },
      },
    },

    ValidatingQuote: {
      always: [
        {
          target: "Error",
          guard: {
            type: "insufficientBalanceForExactOutQuote",
          },
          actions: {
            type: "setError",
            params: () => {
              return {
                reason:
                  "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE",
                error: new Error(
                  "1CS quote succeeded but new amount in exceeds user token in balance"
                ),
              }
            },
          },
        },
        {
          target: "AwaitingPriceChangeConfirmation",
          guard: {
            type: "isWorseThanPrevious",
          },
        },
        {
          target: "GeneratingIntent",
          guard: {
            type: "isQuoteSuccess",
          },
        },
        {
          target: "Error",
          actions: {
            type: "setError",
            params: ({ context }) => {
              if (!context.quote1csResult || "err" in context.quote1csResult) {
                return {
                  reason: "ERR_1CS_QUOTE_FAILED",
                  error: new Error(
                    context.quote1csResult && "err" in context.quote1csResult
                      ? context.quote1csResult.err
                      : "Unknown quote error"
                  ),
                }
              }
              return {
                reason: "ERR_NO_DEPOSIT_ADDRESS",
                error: new Error(
                  "1CS quote succeeded but no deposit address provided"
                ),
              }
            },
          },
        },
      ],
    },

    AwaitingPriceChangeConfirmation: {
      entry: ({ context }) => {
        if (context.quote1csResult && "ok" in context.quote1csResult) {
          const isExactInput =
            context.input.swapType === QuoteRequest.swapType.EXACT_INPUT
          let newOppositeAmount = ""
          let oppositeDecimals = 0
          if (isExactInput) {
            newOppositeAmount = context.quote1csResult.ok.quote.amountOut
            oppositeDecimals = context.input.tokenOut.decimals
          } else {
            newOppositeAmount = context.quote1csResult.ok.quote.amountIn
            oppositeDecimals = context.input.tokenIn.decimals
          }

          context.input.parentRef?.send({
            type: "PRICE_CHANGE_CONFIRMATION_REQUEST",
            params: {
              newOppositeAmount: {
                amount: BigInt(newOppositeAmount),
                decimals: oppositeDecimals,
              },
              previousOppositeAmount: context.input.previousOppositeAmount,
            },
          })
        }
      },
      on: {
        PRICE_CHANGE_CONFIRMED: {
          target: "GeneratingIntent",
        },
        PRICE_CHANGE_CANCELLED: {
          target: "Error",
          actions: {
            type: "setError",
            params: {
              reason: "ERR_WALLET_CANCEL_ACTION",
              error: null,
            },
          },
        },
      },
    },

    GeneratingIntent: {
      invoke: {
        src: "generateIntentActor",
        input: ({ context }) => {
          assert(
            context.quote1csResult != null && "ok" in context.quote1csResult
          )
          assert(context.quote1csResult.ok.quote.depositAddress != null)
          return {
            depositAddress: context.quote1csResult.ok.quote.depositAddress,
            defuseUserId: context.input.defuseUserId,
            userChainType: context.input.userChainType,
          }
        },
        onDone: {
          target: "Signing",
          actions: [
            {
              type: "setGenerateIntentResponse",
              params: ({ event }) => event.output,
            },
            {
              type: "setWalletMessage",
              params: ({ event }) =>
                wrapPayloadAsWalletMessage(event.output.intent),
            },
          ],
        },
        onError: {
          target: "Error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => ({
                reason: "ERR_GENERATE_INTENT_FAILED",
                error:
                  event.error instanceof Error
                    ? event.error
                    : new Error(String(event.error)),
              }),
            },
          ],
        },
      },
    },

    Signing: {
      invoke: {
        id: "signMessage",
        src: "signMessage",
        input: ({ context }) => {
          assert(context.walletMessage != null, "Wallet message is not set")
          return context.walletMessage
        },
        onDone: {
          target: "VerifyingPublicKeyPresence",
          actions: {
            type: "setSignature",
            params: ({ event }) => event.output,
          },
        },
        onError: {
          target: "Error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => ({
                reason: extractWalletErrorCode(
                  event.error,
                  "ERR_USER_DIDNT_SIGN"
                ),
                error: errors.toError(event.error),
              }),
            },
          ],
        },
      },
    },

    VerifyingPublicKeyPresence: {
      invoke: {
        id: "publicKeyVerifierRef",
        src: "publicKeyVerifierActor",
        input: ({ context }) => {
          assert(context.signature != null, "Signature is not set")

          return {
            nearAccount:
              context.signature.type === "NEP413"
                ? context.signature.signatureData
                : null,
            nearClient: context.nearClient,
          }
        },
        onDone: [
          {
            target: "SubmittingIntent",
            guard: {
              type: "isOk",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Error",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err", "Expected error")
                return {
                  reason: event.output.value,
                  error: null,
                }
              },
            },
          },
        ],
        onError: {
          target: "Error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => ({
                reason: "ERR_PUBKEY_EXCEPTION",
                error: errors.toError(event.error),
              }),
            },
          ],
        },
      },
    },

    SubmittingIntent: {
      invoke: {
        src: "submitIntentActor",
        input: ({ context }) => {
          assert(context.signature != null, "Signature is not set")

          return {
            signatureData: context.signature,
            userInfo: {
              userAddress: context.userAddress,
              userChainType: context.userChainType,
            },
          }
        },
        onDone: [
          {
            target: "Completed",
            guard: {
              type: "isOk",
              params: ({ event }) => event.output,
            },
            actions: [
              log("Intent submitted"),
              {
                type: "setIntentHash",
                params: ({ event }) => {
                  assert(event.output.tag === "ok")
                  return event.output.value
                },
              },
            ],
          },
          {
            target: "Error",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return {
                  reason: "ERR_SUBMIT_INTENT_FAILED",
                  server_reason: event.output.value.reason,
                }
              },
            },
          },
        ],
        onError: {
          target: "Error",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: ({ event }) => ({
                reason: "ERR_SUBMIT_INTENT_FAILED",
                error: errors.toError(event.error),
              }),
            },
          ],
        },
      },
    },

    Completed: {
      type: "final",
    },

    Error: {
      type: "final",
    },
  },
})

const get1csQuoteApiWithRetry: typeof get1csQuoteApi = (...args) => {
  return retry(
    () =>
      withTimeout(
        () => get1csQuoteApi(...args),
        { timeout: 15000 } // Quote takes 10s in the worst scenario
      ),
    { maxAttempts: 3, delay: 500 }
  )
}
