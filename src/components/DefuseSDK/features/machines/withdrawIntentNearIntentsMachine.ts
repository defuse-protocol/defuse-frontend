import {
  authIdentity,
  errors,
  solverRelay,
} from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
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

export type NearIntentsWithdrawIntentDescription = {
  type: "withdraw_near_intents"
  totalAmountIn: TokenValue
  totalAmountOut: TokenValue
  recipient: string
}

type Context = {
  input: Input
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  walletMessage: walletMessage.WalletMessage | null
  signature: walletMessage.WalletSignatureResult | null
  intentHash: string | null
  error: null | {
    tag: "err"
    value: {
      reason:
        | "ERR_TRANSFER_MESSAGE_FAILED"
        | "ERR_USER_DIDNT_SIGN"
        | "ERR_CANNOT_VERIFY_SIGNATURE"
        | "ERR_SIGNED_DIFFERENT_ACCOUNT"
        | "ERR_PUBKEY_EXCEPTION"
        | "ERR_CANNOT_PUBLISH_INTENT"
        | WalletErrorCode
        | PublicKeyVerifierErrorCodes
      error: Error | null
    }
  }
}

type Input = {
  tokenIn: BaseTokenInfo
  amountIn: TokenValue
  defuseUserId: string
  deadline: string
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  /** Recipient's intents account (NEAR account ID format) */
  recipient: string
}

export type Output =
  | NonNullable<Context["error"]>
  | {
      tag: "ok"
      value: {
        intentHash: string
        intentDescription: NearIntentsWithdrawIntentDescription
      }
    }

export const withdrawIntentNearIntentsMachine = setup({
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
  },
  actors: {
    createTransferMessageActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          tokenIn: BaseTokenInfo
          amountIn: TokenValue
          recipient: string
          defuseUserId: string
          deadline: string
        }
      }): Promise<walletMessage.WalletMessage> => {
        const tokenInAssetId = input.tokenIn.defuseAssetId

        // For Near Intents transfers, recipient is already a NEAR account ID
        // We need to convert it to intents user ID format
        const recipientIntentsId = authIdentity.authHandleToIntentsUserId(
          input.recipient,
          "near"
        )

        const walletMessage = createTransferMessage(
          [[tokenInAssetId, input.amountIn.amount]],
          {
            signerId: input.defuseUserId as IntentsUserId,
            receiverId: recipientIntentsId,
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
  },
}).createMachine({
  id: "withdraw-intent-near-intents",

  context: ({ input }) => ({
    input,
    userAddress: input.userAddress,
    userChainType: input.userChainType,
    nearClient: input.nearClient,
    walletMessage: null,
    signature: null,
    intentHash: null,
    error: null,
  }),

  initial: "CreatingTransferMessage",

  output: ({ context }): Output => {
    if (context.intentHash != null) {
      return {
        tag: "ok",
        value: {
          intentHash: context.intentHash,
          intentDescription: {
            type: "withdraw_near_intents",
            totalAmountIn: context.input.amountIn,
            totalAmountOut: context.input.amountIn, // 1:1 transfer, no fees
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
    CreatingTransferMessage: {
      invoke: {
        src: "createTransferMessageActor",
        input: ({ context }) => ({
          tokenIn: context.input.tokenIn,
          amountIn: context.input.amountIn,
          recipient: context.input.recipient,
          defuseUserId: context.input.defuseUserId,
          deadline: context.input.deadline,
        }),
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
              log("Near Intents transfer intent published"),
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
                  error: new Error(event.output.value.reason),
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
