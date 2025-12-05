import {
  errors,
  solverRelay,
  withTimeout,
} from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import {
  QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { retry } from "@lifeomic/attempt"
import { getWithdrawQuote as getWithdrawQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
import type { ParentEvents as Background1csWithdrawQuoterParentEvents } from "@src/components/DefuseSDK/features/machines/background1csWithdrawQuoterMachine"
import { logger } from "@src/utils/logger"
import type { providers } from "near-api-js"
import { assign, fromPromise, log, setup } from "xstate"
import { createTransferMessage } from "../../core/messages"
import { convertPublishIntentToLegacyFormat } from "../../sdk/solverRelay/utils/parseFailedPublishError"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import type { IntentsUserId } from "../../types/intentsUserId"
import { assert } from "../../utils/assert"
import { verifyWalletSignature } from "../../utils/verifyWalletSignature"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"
import {
  type ErrorCodes as PublicKeyVerifierErrorCodes,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"

export type WithdrawIntentDescription = {
  type: "withdraw_1cs"
  totalAmountIn: TokenValue
  totalAmountOut: TokenValue
  depositAddress: string
  recipient: string
}

type Context = {
  input: Input
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  quote1csResult:
    | { ok: QuoteResponse }
    | { err: string; originalRequest?: QuoteRequest | undefined }
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
            | "ERR_TRANSFER_MESSAGE_FAILED"
            | "ERR_USER_DIDNT_SIGN"
            | "ERR_CANNOT_VERIFY_SIGNATURE"
            | "ERR_SIGNED_DIFFERENT_ACCOUNT"
            | "ERR_PUBKEY_EXCEPTION"
            | "ERR_CANNOT_PUBLISH_INTENT"
            | "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE"
            | WalletErrorCode
            | PublicKeyVerifierErrorCodes
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
  recipient: string
  parentRef?: {
    send: (
      event:
        | Background1csWithdrawQuoterParentEvents
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
        intentDescription: WithdrawIntentDescription
      }
    }

export const withdrawIntent1csMachine = setup({
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
          type: "NEW_1CS_WITHDRAW_QUOTE",
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
              recipient: context.input.recipient,
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
      async ({
        input,
      }: {
        input: Input & { userChainType: AuthMethod }
      }) => {
        return getWithdrawQuoteApiWithRetry({
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
          recipient: input.recipient,
        })
      }
    ),
    createTransferMessageActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          tokenIn: BaseTokenInfo
          amountIn: { amount: bigint; decimals: number }
          depositAddress: string
          defuseUserId: string
          deadline: string
        }
      }): Promise<walletMessage.WalletMessage> => {
        const tokenInAssetId = input.tokenIn.defuseAssetId

        const walletMessage = createTransferMessage(
          [[tokenInAssetId, input.amountIn.amount]],
          {
            signerId: input.defuseUserId as IntentsUserId,
            receiverId: input.depositAddress,
            deadlineTimestamp: new Date(input.deadline).getTime(),
          }
        )

        return walletMessage
      }
    ),
    verifySignatureActor: fromPromise(
      ({
        input,
      }: {
        input: {
          signature: walletMessage.WalletSignatureResult
          userAddress: string
        }
      }) => {
        return verifyWalletSignature(input.signature, input.userAddress)
      }
    ),
    publicKeyVerifierActor: publicKeyVerifierMachine,
    signMessage: fromPromise(
      async (_: {
        input: walletMessage.WalletMessage
      }): Promise<walletMessage.WalletSignatureResult | null> => {
        throw new Error("signMessage actor must be provided by the parent")
      }
    ),
    broadcastMessage: fromPromise(
      async ({
        input,
      }: {
        input: {
          signatureData: walletMessage.WalletSignatureResult
          userInfo: { userAddress: string; userChainType: AuthMethod }
        }
      }) =>
        solverRelay
          .publishIntent(input.signatureData, input.userInfo, [])
          .then(convertPublishIntentToLegacyFormat)
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
  id: "withdraw-intent-1cs",

  context: ({ input }) => ({
    input,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
    nearClient: input.nearClient,
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
            type: "withdraw_1cs",
            totalAmountIn: {
              amount: BigInt(context.quote1csResult.ok.quote.amountIn ?? "0"),
              decimals: context.input.tokenIn.decimals,
            },
            totalAmountOut: {
              amount: BigInt(context.quote1csResult.ok.quote.amountOut ?? "0"),
              decimals: context.input.tokenOut.decimals,
            },
            depositAddress: context.quote1csResult.ok.quote.depositAddress,
            recipient: context.input.recipient,
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
          target: "CreatingTransferMessage",
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
          target: "CreatingTransferMessage",
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

    CreatingTransferMessage: {
      invoke: {
        src: "createTransferMessageActor",
        input: ({ context }) => {
          assert(
            context.quote1csResult != null && "ok" in context.quote1csResult
          )
          assert(context.quote1csResult.ok.quote.depositAddress != null)
          const isExactIn =
            context.input.swapType === QuoteRequest.swapType.EXACT_INPUT
          const amount = BigInt(
            (isExactIn
              ? context.input.amountIn.amount
              : context.quote1csResult.ok.quote.amountIn) ?? "0"
          )
          assert(
            amount > 0n,
            isExactIn
              ? "Invalid input amount, must be greater than 0"
              : "Quote missing amountIn or amountIn is 0 for exact-out swap"
          )
          return {
            tokenIn: context.input.tokenIn,
            amountIn: {
              amount,
              decimals: context.input.tokenIn.decimals,
            },
            depositAddress: context.quote1csResult.ok.quote.depositAddress,
            defuseUserId: context.input.defuseUserId,
            deadline: context.input.deadline,
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
                reason: "ERR_TRANSFER_MESSAGE_FAILED",
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
          target: "VerifyingSignature",
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

    VerifyingSignature: {
      invoke: {
        src: "verifySignatureActor",
        input: ({ context }) => {
          assert(context.signature != null, "Signature is not set")
          return {
            signature: context.signature,
            userAddress: context.userAddress,
          }
        },
        onDone: [
          {
            target: "VerifyingPublicKeyPresence",
            guard: {
              type: "isTrue",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Error",
            actions: {
              type: "setError",
              params: {
                reason: "ERR_SIGNED_DIFFERENT_ACCOUNT",
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
                reason: "ERR_CANNOT_VERIFY_SIGNATURE",
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
            target: "BroadcastingIntent",
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

    BroadcastingIntent: {
      invoke: {
        src: "broadcastMessage",
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
              log("Intent published"),
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
                  reason: "ERR_CANNOT_PUBLISH_INTENT",
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
