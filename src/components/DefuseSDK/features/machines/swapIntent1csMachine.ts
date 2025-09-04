import { errors, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import {
  type GetQuoteResult,
  getQuote as get1csQuoteApi,
} from "@src/components/DefuseSDK/features/machines/1cs"
import type { ParentEvents as Background1csQuoterParentEvents } from "@src/components/DefuseSDK/features/machines/background1csQuoterMachine"
import type { providers } from "near-api-js"
import { assign, fromPromise, setup } from "xstate"
import { createTransferMessage } from "../../core/messages"
import { logger } from "../../logger"
import { convertPublishIntentToLegacyFormat } from "../../sdk/solverRelay/utils/parseFailedPublishError"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../types/base"
import type { IntentsUserId } from "../../types/intentsUserId"
import { assert } from "../../utils/assert"
import { isBaseToken } from "../../utils/token"
import { verifyWalletSignature } from "../../utils/verifyWalletSignature"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"
import { isOk } from "./1csResult"
import type { Quote1csInput } from "./background1csQuoterMachine"
import {
  type ErrorCodes as PublicKeyVerifierErrorCodes,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"
import type { IntentDescription } from "./swapIntentMachine"

function getTokenAssetId(token: BaseTokenInfo | UnifiedTokenInfo) {
  return isBaseToken(token)
    ? token.defuseAssetId
    : token.groupedTokens[0].defuseAssetId
}

type Context = {
  input: Input
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  quote1csResult: GetQuoteResult | null
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

type Input = Quote1csInput & {
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  parentRef?: {
    send: (event: Background1csQuoterParentEvents) => void
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
        const tokenInAssetId = getTokenAssetId(context.input.tokenIn)
        const tokenOutAssetId = getTokenAssetId(context.input.tokenOut)

        context.input.parentRef?.send({
          type: "NEW_1CS_QUOTE",
          params: {
            result: context.quote1csResult,
            quoteInput: context.input,
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
      }: { input: Quote1csInput & { userChainType: AuthMethod } }) => {
        const tokenInAssetId = getTokenAssetId(input.tokenIn)
        const tokenOutAssetId = getTokenAssetId(input.tokenOut)

        try {
          const result = await get1csQuoteApi({
            dry: false,
            slippageTolerance: Math.round(input.slippageBasisPoints / 100),
            quoteWaitingTimeMs: 3000,
            originAsset: tokenInAssetId,
            destinationAsset: tokenOutAssetId,
            amount: input.amountIn.amount.toString(),
            deadline: input.deadline,
            userAddress: input.userAddress,
            authMethod: input.userChainType,
          })

          return result
        } catch {
          logger.error("1cs quote request failed")
          return { err: "Quote request failed" }
        }
      }
    ),
    createTransferMessageActor: fromPromise(
      async ({
        input,
      }: {
        input: {
          tokenIn: BaseTokenInfo | UnifiedTokenInfo
          amountIn: { amount: bigint; decimals: number }
          depositAddress: string
          defuseUserId: string
          deadline: string
        }
      }): Promise<walletMessage.WalletMessage> => {
        // Create the transfer message using createTransferMessage
        const tokenInAssetId = getTokenAssetId(input.tokenIn)

        const walletMessage = createTransferMessage(
          [[tokenInAssetId, input.amountIn.amount]], // tokenDeltas
          {
            signerId: input.defuseUserId as IntentsUserId, // signer
            receiverId: input.depositAddress, // receiver (deposit address from 1CS)
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
        isOk(context.quote1csResult) &&
        context.quote1csResult.ok.quote.depositAddress != null
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaAlgOwBcxCsBGAY1gDoAxMA8gC3ygtgEUBXAeyIGII3PGCr4AbtwDWI1JlyFiBMpVr0mLNl15gE47uTQEcQgNoAGALrmLiUBm6wcRobZAAPRACYAnAFYqvmZmpAAsvgDspOHh3qQAHCEANCAAnl4+VKEAzJ5ZWQBsCd4hwXEAvmXJstj4RCRsqgzMeKyUWvxgAE6d3J1UGAA2hgBmvQC2VNXydUoNdE0abTxEungSBs541tau9o6brh4IPv6BwWGR0bEJyWkIcaQBQcFmEX6+viH5FVXoNQr1FQANTQAxwEEMLHaYD4OyQID2TmMeEOiHy3jiVCCcTM4TiWW84U8vk8cVuiBCpKocTipNIpAxxPyIVCPxAU1qimU1BBYIhRha0NhpBs8MRB3hR3RmOxuPxhOJpPJxwKVHCZiypDyhPRuQ1bI5ANmKgAwp0wJCWgAVTpoPCwYZdACycFgaBgAiEIj00kmf2mXIaZotAqgNrtDudrvdOj0G2R20suwcSJcksQpE8ryo+WZBTx+QJsXyyt8+TMObM3gJMRJxXKlXZ-s5gOowctYdt9sdnRdsDdHq6PT6gxG4z9chbxrb5o74e7Uf7MdW60hpkscLsKYloCOmezuZC+bihe8xeVWWiVG8PnRuJiISPIQNzaN3KoAGUcFA8CxPcJRDWKQZG-PA+wHMBNwRbdkVRBB4iCLE8RZLJcRCaItWVB8AlIMt0WZOJwnLb5G0NGZ3y-H8-yHXp+iGAhRk6CZHB-cCYyg8VYPTeCcQrOUULQjCslLPJMhyWlM08IkFRfSc3waIEuhwYYUhYSi8EMThzX-b0gN9MjA2BJSVLU0DNPNFd9DXLYNyTMUYLTXd0hCTF1SyEpCg+R98nCZUtS1AJPgeGINXcolZP+ciFOM1SWnU8yYUEACfRkV8oqMzplNiqB4oILTYyA+N1ysEVk32LinOOTwXLVDUPLiLyvl81I0RpKg8l8PxSB83xcKrCKA1bKhFMyky4rMvLtJokd6MY5i0sMnkYtMn8EssoqbKsOyt3Kxz3Gc1y6rMTzPiarCHioUlvFxDVPCk8I8gGqd3xGrKWAABU4AAjMFyAAaTAFJ3vNWBiHIRKvUAiRfQwb7foBlJXuGHAugAJTAYYOIclFuJ8YoAkLMxckJBJ7z8uUc2JMx8RJHFqqe+SMrelpPp+nB-sB4G4DBiHkr0kRYbZjnEeMlHOnRzHSvs3accqvGQgJ1DieQsmWvgnwK1pWlquqgoiayBn0qW0bstZ+HOZBnm+GmuixyY-o4fZhGkbFiWsZluD5cV-WSZKaI-KyfE1QedyrsklzDcWqgACEejQCADFgUMAEkjR0qHgInSKo9j7h48TlOjXW6zE1FHbU1l-aECyTrHkzXxA9eItLySNX6RqhruuZWJCWLSOhtz-O0CTlhU5mdOUqzwbpxjuOE+HwuZmLzZtil8udyrmvYkyYlG4bs8W-Jj5qQxT58ikzxutifuZ8H+eR5aMfFGt7paNHBjxwMge54L0ei7jEutky7QQ9txLeddd44n3tWcIrc7jVnyFQEIN47pxAVBEBkN8KLfTGE4UMVo3AAAlh6MAnvzKez0GgfhwXglgBDiGwEYMvBMQCyoVzgpSZkl13LFl8Gg2kwk253XCIFdCREQpEkfFgqhNCCD4KISQl+w5bYf3tl-Ge1Cvq4LkXQhRjDmHFXduw7inCFa5GQd1PhjJBF3HpO5SsljSBVk8PkXCDZGx4G4BAOArh1HcjYRvI4WASxqywP4M8ESiaX2urEcKpEFpDXmOoFomhlhgACRVKulJyYiKzJqHIUQjyfDib8OSRthqgnBB2aEGS9pHBJIgnUD1cy9WeL4ZULiFZVkLHwqIl5QjhGkaaWc+CuyRl7NGGAtTK5HDQf4Bq3hyw5D8PiTMyoShZBzOJUktIG4YSGdQdSLBplwVCNWJBYQIhEXQmWE8pY+HUi3iUdCDJQ4HOGstcaq1JrpOlsYyqDJro5jLEeOUoRXHNTuDETwapKTEkfOqQ8nh3lI1No7YWXNQZ4HBic3GnVMRllvDkT4xIHp+Skt4UR4Q+E5DxJ1ZF8Syk5x-gvP+MxcWVTyCyR5hZkF3UKLmGxGZXgK3rv5KsfspLvM0do+RDDGAcqycEGF-KzyX2iPidCfkBlIQeNWPIeIm7vJNNwMYgx6CQEVUcR8+NomknPlEO63htXn1hS5BIOJurHXeQAUVfp0K1FJ1QiPpFJY6RNgjFBde1F4GJLy4mKIMioZQgA */
  id: "swap-intent-1cs",

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
          isOk(context.quote1csResult) &&
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
            totalAmountIn: context.input.amountIn,
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

    CreatingTransferMessage: {
      invoke: {
        src: "createTransferMessageActor",
        input: ({ context }) => {
          assert(context.quote1csResult != null && isOk(context.quote1csResult))
          assert(context.quote1csResult.ok.quote.depositAddress != null)

          return {
            tokenIn: context.input.tokenIn,
            amountIn: context.input.amountIn,
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
            actions: {
              type: "setIntentHash",
              params: ({ event }) => {
                assert(event.output.tag === "ok")
                return event.output.value
              },
            },
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
