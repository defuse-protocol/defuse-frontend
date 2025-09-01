import { errors, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { getQuote as get1csQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
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
import type { Quote1csInput } from "./background1csQuoterMachine"
import {
  type ErrorCodes as PublicKeyVerifierErrorCodes,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"

function getTokenAssetId(token: BaseTokenInfo | UnifiedTokenInfo) {
  return isBaseToken(token)
    ? token.defuseAssetId
    : token.groupedTokens[0].defuseAssetId
}

type Context = {
  input: Quote1csInput
  userAddress: string
  userChainType: AuthMethod
  nearClient: providers.Provider
  quote1csResult:
    | {
        ok: {
          quote: {
            amountIn?: string
            amountOut?: string
            deadline?: string
            depositAddress?: string
          }
        }
      }
    | { err: string }
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
}

export type Output =
  | NonNullable<Context["error"]>
  | {
      tag: "ok"
      value: {
        intentHash: string
        depositAddress: string
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
  },
  actors: {
    fetch1csQuoteActor: fromPromise(
      async ({ input }: { input: Quote1csInput }) => {
        const tokenInAssetId = getTokenAssetId(input.tokenIn)
        const tokenOutAssetId = getTokenAssetId(input.tokenOut)

        try {
          const result = await get1csQuoteApi({
            dry: false, // This will include depositAddress
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            slippageTolerance: Math.round(input.slippageBasisPoints / 100),
            quoteWaitingTimeMs: 3000,
            originAsset: tokenInAssetId,
            depositType: QuoteRequest.depositType.INTENTS,
            destinationAsset: tokenOutAssetId,
            amount: input.amountIn.amount.toString(),
            refundTo: input.defuseUserId,
            refundType: QuoteRequest.refundType.INTENTS,
            recipient: input.defuseUserId,
            recipientType: QuoteRequest.recipientType.INTENTS,
            deadline: input.deadline,
            referral: input.referral,
          })

          return result
        } catch (_error) {
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
        "ok" in context.quote1csResult &&
        context.quote1csResult.ok.quote.depositAddress != null
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaAlgOwBcxCsBGAY1gDoAxMA8gC3ygtgEUBXAeyIGII3PGCr4AbtwDWI1JlyFiBMpVr0mLNl15gE47uTQEcQgNoAGALrmLiUBm6wcRobZAAPRACYAnAFYqvmZBngDMnmbepABsIQDsADQgAJ5eACyeVCFR3rGkpKmknr7eBakAvmWJstj4RCRsqgzMeKyUWvxgAE6d3J1UGAA2hgBmvQC2VNXydUoNdE0abTxEungSBs541tau9o6brh4IPv6BwWER0XGJKQgAHKRUqd7ed68xb56pdyEVVeg1BT1FQANTQAxwEEMLHaYD4OyQID2TmMeEOiGydyoQVid1icXOoRuiHSWLud08FMKsSi3zxUT+ICmtUUymoYIhUKMLVh8NINkRyIOiKOmOxZlx+NihJCxOOWSo0pCZlINLuxVIEXKlSZAOmrIaAGFOmBoS0ACqdNB4WDDLoAWTgsDQMAEQhEemkkz1LOB1GNpu5UEt1ttDqdLp0eg2qO2ll2DhRLhFiEKZn8UVpRRCqSiPiiZk8ct8BaoBe8IUK31C4W8jOZQNmKgDZuDVptds6jtgztdXR6fUGI3G3rkvqb-pNrZDHfDPcjq3W0NMlgRdkTwtARzTGazvhzee8BaLyUQcViVG8+dpb0Cr089Z9jbZVAAyjgoHgWG7hKI1lIZA-PBu17MA1yRDdUXRBBSDuIJsVxHM4kxZ4T1uaVvEVPIzErTxaVxHJHzHZ8GnfT9v37Xp+iGAhRk6CZHE-EDI3AoUoJTGC4LMBCflSZDXlQ4sQhCKhSDCRCSnCO4+KIwEZhfEEuhwYYkhYMi8EMTgTR-D1-y9Bt5IaRTOmU1SWnUzSTUXfRly2Vd40FSDky3LwiixJU8N8UgS3Jb45TxTDogKLIfmyHIHx1AyDVBJSVLUoDLLhQRf09GQn0MmKTLi8yEoILSo3-GMVysfkE32diXOONzFRwzzvKiXy7jlBqsWE4pC1ebwJXTWT9T9KhjNM+LP0SvhKMHGi6IY9LovZWKzKgCy8qs6NbLjAV13K5z3Fc3x3NqqIvJ86SmtPGDcyxAt8nTHxNXCWJevHBT5pYAAFTgACMIXIABpMAklek1YGIcgkvdP8JC9DBPu+v6kkG4YcC6AAlMBhlYpy0Q45V8gCPNfDw+9cyJM67swqJVU8TwpQpBrHpIzKhpad6vpwX7-sBuAQbBlK9JEaHWfZ+HYqRzpUfR0rHK2rHKpx1I8aKQmKWJ2Uzp+bjcK8nHeNeemMrmrKFpZ2GOaB7mxu6Kih1okcBZN4WstF8WMel6C5YVgnMS+PNVduMSxMye87jzVJUhw3M9dmqgACEejQCADFgIMAElGx0iGANHOSo9j7h48TlPG2soq7KsBzNqTGWdoQLJPEeKtYnSdNCkrVI5TyaSy2+EIfjrmI8kj-rc-ztAk5YVOZnT1Ks76icY7jhPR8LmZi7W1dJYrzdq9r+uvkb8IvNCfJ28uMs-CyPICiu35IpmoeF4L8e0-G6jh3omenoaYfF7HloJ8UVemx1plUrm7PMu9Uj72bkfNuZ1wpUEpJEUIZhIGHlIBUHUeBuAQDgK4KKfoQFbyOFgKIcoSGDznvMdQLRNDLDAIQiq1d0gnwvOEZUocYi+FzIhChClwSQlbLCBh20jie0vDSPajdVRXlgnKPC8sIicNgiqLhsRfC8KNFOIMM4wxdgjDAYRVcji3ioOqEoXDJK4j2nKMOIkYjU1Dm8aUXw7gaJUOpFghjoL5ArE8VIXDQ7PG+OkWBtxfB7VMSEPaMQShhzyOg2+xF9YDRejlEay16FS1ARxUgLxuKHRiXxKI0oYgJDOtKC8FZG4-HxP48J2p-hJKjgjI2MM2Zw05sDPAoMvEcTwmYLEJY8LkhVNKfxvtEDSX8EFIKRQgh8VcYk7O9884-2XooXpssL6RJ8g1KmwcT7plEpTQoDwBn3Tcf6bgYxBj0EgJsphwQEF4W8mJTMEQJkwQPqJFxXD2p5hwpcqgABRS2nQHlHDDoWZ5FMtbvIrHKXI3Euo5hpCg3M4cMFlCAA */
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
          "ok" in context.quote1csResult &&
          context.quote1csResult.ok.quote.depositAddress != null,
        "Deposit address must be set when intent hash is available"
      )

      return {
        tag: "ok",
        value: {
          intentHash: context.intentHash,
          depositAddress: context.quote1csResult.ok.quote.depositAddress,
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
          actions: {
            type: "set1csQuoteResult",
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
          assert(
            context.quote1csResult != null && "ok" in context.quote1csResult
          )
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
