import { errors, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { getQuote as get1csQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
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
        "ok" in context.quote1csResult &&
        context.quote1csResult.ok.quote.depositAddress != null
      )
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaAlgOwBcxCsBGAY1gDoAxMA8gC3ygtgEUBXAeyIGII3PGCr4AbtwDWI1JlyFiBMpVr0mLNl15gE47uTQEcQgNoAGALrmLiUBm6wcRobZAAPRACYAnAFYqvmZBngAcvgAsvr6eAMy+ADQgAJ5ePlSk4TE+vn5mPmakAOwAvsWJstj4RCRsqgzMeKyUWvxgAE5t3G1UGAA2hgBmXQC2VBXy1Uq1dPUazTxEungSBs541tau9o5rrh4I2QFBeWGR0XGJKQghpEdBAGxm4Z7hpN6FITGl5eiVCjUqABqaF6OAghhYLTAfE2SBA2ycxjwe0Q928ISoQQ+6JChV8MXCZgSyUQzwxIRC2VIZnu91I90+3xA4yqimU1GBoPBRkaUJhpBscIRuzh+zRGKxIRxeIJRMuXhi9yohTMMSKRU8qs1Zm8TJZ-ymKgAwm0wBDGgAVNpoPCwAbtACycFgaBgAiEIj00jGvwmbNqJrNPKgVptdsdztdOj0qyRG0sWwciJcosQpE1-lpz18p3RhXT8oQvkeVEe3kyhRVeIyXzKzN9rIB1ED5pD1tt9raTtgLrd7U63T6gxGPrkjcNzdNrdDHYjPajSxWENMllhdiTItA+3TRNL92zudxBZJCBilao3h8hWepDilPT4T1DYN7KoAGUcFA8Cx3cJRMspBkT88G7XswDXeENyRFEEFIEIgkxD43nzbx908OlCxVbxlWpbxb3ufEohKOt9UmV8Py-H9+y6Hp+gIIY2lGRwv1AqMIOFaDU1g+CzEQm53jeNCMJPfEYnSLJ3iyUhfHTWInzHF9akBdocAGJIWAovBDE4U1f09ADvVI-0gRUtSNOA7TTUXfRl3WVcEyFKCUy3VIc2VVVnhxYtL2JK5cWw+kbyJPJAmk+S-jIpTTPUxpNMs6FBD-L0ZGfSKTLaVSYqgOKCB06MANjFcrAFRMdk4lyDk8NyVQJHwKW8qrCwZDEYkVMwQkiUgH3Ce5wr9JsqGUjKzNiizct06jBzohimNS4yOWi8yv3i6zCrsqwHPXMrnPcVyMRqzz6rRRqTwyBlSwKEJ7hiDqet8QpepIuaBqGzKWAABU4AAjUFyAAaTAJJ3tNWBiHIBKPX-CRvQwb7foBpJXoGHB2gAJTAAZ2Kc5EuJiApwgCe5snCKVrvxQtqTSOlCjPST2qJvrx1fJGss+n6cH+wHgbgMGIaSgyRFh9nOcR0yUbadHMZKxztpxiq8YyQnidJuIYkLT5eLVdCikJdFfEZxT0rexo2fhrmQd5vhJto4dGJ6OGOYRpHxclrHZZghWCeLZXUNVim1TEmI82iCIwjiR6fgUtLqAAIU6NAIAMWBgwASQNPSocA0cIvmqg4+4BOk9Tg1Vts+NBS25M5d20991udCrpkl4pROq4urCdISaiDqbna1CDejvP48TtBk5YNPJgz5Ls-6ich4Lkex8aCfFFLtYNmlyvNxrxUXioHqPiJ+66XuimaTEomup8-F7hVR8nqj3P88L0fi8n62h3okcjIG5-F7f1eMYy72QrpBd2uMu771arEVqOQKQ03VmkF4hJ0L3WpOEXUTI8DcAgHAVwP8JylSrjBLA9xCykIHrnGY6hGiaAWGAIh299jPDPoUKgmo1Q5FQjeTwVVKEvRBGCVsUJGHlRrtEJU7wsxVU8CqYsZCTzoQJjqOubwzpB34XPFswYZzhi7JGGAoidr7ClP4MIfgihSnRETTwhZCQX1ak8W8GQD70k0eRYCLAjHV23BgsS4RIiZAwTSPCCirjdyoJ8R4hRZFRHwiEdxUVhpZRynlbxME3jeF4gRfcBRLxZBPphMwbDvBnlpD3TIOYI71kfi9RaJsHYi25qDPA4N0lcXQu1JWnwHrIL8OEdWkR0hoRyJwzUnhEkqD-kXceBp2ny0VLcKJJNWpojyASM+u4urXiyD1Xh+5MGRxzgNI03Bhh9HoJAeZNdCR5HYbIvIJM3gBIiBTDM6QZEfDiJeapBDXwAFEOhdGucw4I9yVTN2eYEzC1ILweUPuWHM99ShAA */
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
