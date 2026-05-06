import {
  errors,
  prepareBroadcastRequest,
  withTimeout,
} from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { retry } from "@lifeomic/attempt"
import {
  generateIntent,
  getWithdrawQuote as getWithdrawQuoteApi,
  submitIntent,
} from "@src/components/DefuseSDK/features/machines/1cs"
import {
  isValidAndWorseWithdrawQuote,
  isValidWithdrawQuote,
  isWorseWithdrawQuoteThanPrevious,
  parseQuoteAmount,
} from "@src/components/DefuseSDK/features/machines/utils/1csQuoteValidation"
import type { IntentDescription } from "@src/components/DefuseSDK/types/intent"
import { getWithdrawDestinationAsset } from "@src/components/DefuseSDK/utils/oneClickAssetRouting"
import { logger } from "@src/utils/logger"
import { assign, fromPromise, log, setup } from "xstate"
import { wrapPayloadAsWalletMessage } from "../../core/messages"
import type { BaseTokenInfo, TokenDeployment } from "../../types/base"
import { assert } from "../../utils/assert"
import { AUTH_METHOD_TO_STANDARD } from "../../utils/intentStandards"
import { adjustDecimals } from "../../utils/tokenUtils"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"

type Context = {
  input: Input
  userAddress: string
  userChainType: AuthMethod
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
    | {
        err: string
        originalRequest?: QuoteRequest | undefined
      }
    | null
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
            | "ERR_QUOTE_WORSE_THAN_REVIEWED"
            | "ERR_GENERATE_INTENT_FAILED"
            | "ERR_FAILED_TO_PREPARE_MESSAGE_TO_SIGN"
            | "ERR_USER_DIDNT_SIGN"
            | "ERR_CANNOT_PUBLISH_INTENT"
            | WalletErrorCode
          error: Error | null
        }
      | {
          reason: "ERR_CANNOT_PUBLISH_INTENT"
          server_reason: string
        }
  }
}

type Input = {
  tokenIn: BaseTokenInfo
  tokenOut: BaseTokenInfo
  tokenOutDeployment: TokenDeployment
  swapType: QuoteRequest.swapType
  slippageBasisPoints: number
  defuseUserId: string
  deadline: string
  userAddress: string
  userChainType: AuthMethod
  nearClient: unknown
  amountIn: { amount: bigint; decimals: number }
  recipient: string
  recipientType: QuoteRequest.recipientType
  destinationMemo?: string
  virtualChainRecipient?: string
  destinationChainName?: string
  minAmountOut?: bigint
  previousOppositeAmount: { amount: bigint; decimals: number }
  parentRef?: {
    send: (event: {
      type: "EXECUTION_QUOTE_READY"
      params: {
        newAmountIn: { amount: bigint; decimals: number }
        newOppositeAmount: { amount: bigint; decimals: number }
        previousOppositeAmount: { amount: bigint; decimals: number }
      }
    }) => void
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

export const withdraw1csMachine = setup({
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
      if (params.error != null) {
        logger.error(params.error)
      }
    },
    set1csQuoteResult: assign({
      quote1csResult: (_, result: NonNullable<Context["quote1csResult"]>) =>
        result,
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
      if (
        context.quote1csResult &&
        "ok" in context.quote1csResult &&
        context.input.parentRef
      ) {
        context.input.parentRef.send({
          type: "EXECUTION_QUOTE_READY",
          params: {
            newAmountIn: {
              amount: BigInt(context.quote1csResult.ok.quote.amountIn),
              decimals: context.input.tokenIn.decimals,
            },
            newOppositeAmount: {
              amount: BigInt(context.quote1csResult.ok.quote.amountOut),
              decimals: context.input.tokenOut.decimals,
            },
            previousOppositeAmount: context.input.previousOppositeAmount,
          },
        })
      }
    },
  },
  actors: {
    fetch1csQuoteActor: fromPromise(
      async ({ input }: { input: Input & { userChainType: AuthMethod } }) => {
        return getWithdrawQuoteApiWithRetry({
          dry: false,
          slippageTolerance: Math.round(input.slippageBasisPoints / 100),
          originAsset: input.tokenIn.defuseAssetId,
          destinationAsset: getWithdrawDestinationAsset(
            input.tokenOut.defuseAssetId
          ),
          amount: (input.swapType === QuoteRequest.swapType.EXACT_OUTPUT
            ? adjustDecimals(
                input.amountIn.amount,
                input.amountIn.decimals,
                input.tokenOut.decimals
              )
            : input.amountIn.amount
          ).toString(),
          deadline: input.deadline,
          userAddress: input.userAddress,
          authMethod: input.userChainType,
          swapType: input.swapType,
          recipient: input.recipient,
          recipientType: input.recipientType,
          ...(input.destinationMemo
            ? { destinationMemo: input.destinationMemo }
            : {}),
          ...(input.virtualChainRecipient
            ? { virtualChainRecipient: input.virtualChainRecipient }
            : {}),
          ...(input.destinationChainName
            ? { destinationChainName: input.destinationChainName }
            : {}),
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
      }): Promise<walletMessage.WalletMessage> => {
        const standard = AUTH_METHOD_TO_STANDARD[input.userChainType]
        const result = await generateIntent({
          depositAddress: input.depositAddress,
          signerId: input.defuseUserId,
          standard,
        })

        if ("err" in result) {
          throw new Error(result.err)
        }

        return wrapPayloadAsWalletMessage(result.ok.intent)
      }
    ),
    signMessage: fromPromise(
      async (_: {
        input: walletMessage.WalletMessage
      }): Promise<walletMessage.WalletSignatureResult | null> => {
        throw new Error("signMessage actor must be provided by the parent")
      }
    ),
    submitIntentActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          signatureData: walletMessage.WalletSignatureResult
          userInfo: { userAddress: string; userChainType: AuthMethod }
        }
      }) => {
        const signedIntent = prepareBroadcastRequest.prepareSwapSignedData(
          input.signatureData,
          input.userInfo
        )
        const result = await submitIntent({ signedIntent })
        if ("err" in result) {
          return { tag: "err" as const, value: { reason: result.err } }
        }
        return { tag: "ok" as const, value: result.ok.intentHash }
      }
    ),
  },
  guards: {
    isTrue: (_, params: boolean) => params,
    isSigned: (_, params: walletMessage.WalletSignatureResult | null) =>
      params != null,
    isOk: (_, params: { tag: "ok" } | { tag: "err" }) => params.tag === "ok",
    isWorseThanPrevious: ({ context }) => {
      return isWorseWithdrawQuoteThanPrevious({
        quote1csResult: context.quote1csResult,
        swapType: context.input.swapType,
        requestedAmountIn: context.input.amountIn.amount,
        inputAmountDecimals: context.input.amountIn.decimals,
        outputAmountDecimals: context.input.tokenOut.decimals,
        minAmountOut: context.input.minAmountOut,
        previousOppositeAmount: context.input.previousOppositeAmount.amount,
      })
    },
    isQuoteSuccess: ({ context }) => {
      return isValidWithdrawQuote({
        quote1csResult: context.quote1csResult,
        swapType: context.input.swapType,
        requestedAmountIn: context.input.amountIn.amount,
        inputAmountDecimals: context.input.amountIn.decimals,
        outputAmountDecimals: context.input.tokenOut.decimals,
        minAmountOut: context.input.minAmountOut,
      })
    },
    isQuoteSuccessAndWorseThanPrevious: ({ context }) => {
      return isValidAndWorseWithdrawQuote({
        quote1csResult: context.quote1csResult,
        swapType: context.input.swapType,
        requestedAmountIn: context.input.amountIn.amount,
        inputAmountDecimals: context.input.amountIn.decimals,
        outputAmountDecimals: context.input.tokenOut.decimals,
        minAmountOut: context.input.minAmountOut,
        previousOppositeAmount: context.input.previousOppositeAmount.amount,
      })
    },
  },
}).createMachine({
  id: "withdraw-intent-1cs",

  context: ({ input }) => ({
    input,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
    quote1csResult: null,
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
            type: "withdraw",
            tokenOut: context.input.tokenOut,
            tokenOutDeployment: context.input.tokenOutDeployment,
            recipient: context.input.recipient,
            depositAddress: context.quote1csResult.ok.quote.depositAddress,
            totalAmountIn: {
              amount: BigInt(context.quote1csResult.ok.quote.amountIn ?? "0"),
              decimals: context.input.tokenIn.decimals,
            },
            totalAmountOut: {
              amount: BigInt(context.quote1csResult.ok.quote.amountOut ?? "0"),
              decimals: context.input.tokenOut.decimals,
            },
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
          target: "AwaitingUserConfirmation",
          guard: { type: "isQuoteSuccessAndWorseThanPrevious" },
        },
        {
          target: "AwaitingUserConfirmation",
          guard: { type: "isQuoteSuccess" },
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

              if (context.quote1csResult.ok.quote.depositAddress == null) {
                return {
                  reason: "ERR_NO_DEPOSIT_ADDRESS",
                  error: new Error(
                    "1CS quote succeeded but no deposit address provided"
                  ),
                }
              }

              const quoteAmountIn = parseQuoteAmount(
                context.quote1csResult.ok.quote.amountIn
              )

              if (
                quoteAmountIn === null ||
                quoteAmountIn !== context.input.amountIn.amount
              ) {
                return {
                  reason: "ERR_1CS_QUOTE_FAILED",
                  error: new Error(
                    "Quoted amountIn does not match requested withdrawal amount"
                  ),
                }
              }

              if (context.input.minAmountOut != null) {
                const quoteAmountOut = parseQuoteAmount(
                  context.quote1csResult.ok.quote.amountOut
                )
                if (
                  quoteAmountOut === null ||
                  quoteAmountOut < context.input.minAmountOut
                ) {
                  return {
                    reason: "ERR_QUOTE_WORSE_THAN_REVIEWED",
                    error: new Error(
                      `Executed amountOut ${quoteAmountOut} < reviewed ${context.input.minAmountOut}`
                    ),
                  }
                }
              }

              return {
                reason: "ERR_1CS_QUOTE_FAILED",
                error: new Error("1CS quote validation failed"),
              }
            },
          },
        },
      ],
    },

    AwaitingUserConfirmation: {
      entry: "notifyQuoteResult",
      on: {
        CONFIRMED: {
          target: "GeneratingIntent",
        },
        CANCELLED: {
          target: "Error",
          actions: {
            type: "setError",
            params: {
              reason: "ERR_USER_DIDNT_SIGN",
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
          actions: {
            type: "setWalletMessage",
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
        onDone: [
          {
            target: "SubmittingIntent",
            guard: {
              type: "isSigned",
              params: ({ event }) => event.output,
            },
            actions: {
              type: "setSignature",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Error",
            actions: {
              type: "setError",
              params: {
                reason: "ERR_USER_DIDNT_SIGN",
                error: null,
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
              log("Withdraw intent submitted"),
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
            actions: [
              {
                type: "logError",
                params: ({ event }) => {
                  assert(event.output.tag === "err")
                  return {
                    error: new Error(
                      `Failed to submit withdraw intent: ${event.output.value.reason}`
                    ),
                  }
                },
              },
              {
                type: "setError",
                params: ({ event }) => {
                  assert(event.output.tag === "err")
                  return {
                    reason: "ERR_CANNOT_PUBLISH_INTENT",
                    server_reason: event.output.value.reason,
                  }
                },
              },
            ],
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
                reason: "ERR_CANNOT_PUBLISH_INTENT",
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

const getWithdrawQuoteApiWithRetry: typeof getWithdrawQuoteApi = (...args) => {
  return retry(
    () => withTimeout(() => getWithdrawQuoteApi(...args), { timeout: 15000 }),
    { maxAttempts: 3, delay: 500 }
  )
}
