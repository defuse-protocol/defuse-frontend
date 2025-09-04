import type {
  Intent,
  Nep413DefuseMessageFor_DefuseIntents,
} from "@defuse-protocol/contract-types"
import type {
  FeeEstimation,
  WithdrawalParams,
} from "@defuse-protocol/intents-sdk"
import { errors, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { messageFactory } from "@defuse-protocol/internal-utils"
import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { secp256k1 } from "@noble/curves/secp256k1"
import { APP_FEE_RECIPIENT } from "@src/utils/environment"
import type { providers } from "near-api-js"
import { assign, fromPromise, setup } from "xstate"
import { settings } from "../../constants/settings"
import { logger } from "../../logger"
import { convertPublishIntentToLegacyFormat } from "../../sdk/solverRelay/utils/parseFailedPublishError"
import { emitEvent } from "../../services/emitter"
import type { AggregatedQuote } from "../../services/quoteService"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenValue,
} from "../../types/base"
import type { IntentsUserId } from "../../types/intentsUserId"
import { assert } from "../../utils/assert"
import { PriorityQueue } from "../../utils/priorityQueue"
import {
  accountSlippageExactIn,
  addAmounts,
  compareAmounts,
  computeTotalDeltaDifferentDecimals,
  negateTokenValue,
  subtractAmounts,
} from "../../utils/tokenUtils"
import { verifyWalletSignature } from "../../utils/verifyWalletSignature"
import {
  type WalletErrorCode,
  extractWalletErrorCode,
} from "../../utils/walletErrorExtractor"
import type { ParentEvents as BackgroundQuoterEvents } from "./backgroundQuoterMachine"
import {
  type ErrorCodes as PublicKeyVerifierErrorCodes,
  publicKeyVerifierMachine,
} from "./publicKeyVerifierMachine"

// No-op usage to prevent tree-shaking. sec256k1 is dynamically loaded by viem.
const _noop = secp256k1.getPublicKey || null

type IntentOperationParams =
  | {
      type: "swap"
      tokensIn: BaseTokenInfo[]
      tokenOut: BaseTokenInfo
      quote: AggregatedQuote
    }
  | {
      type: "withdraw"
      tokenOut: BaseTokenInfo
      quote: AggregatedQuote | null
      feeEstimation: FeeEstimation
      directWithdrawalAmount: TokenValue
      recipient: string
      destinationMemo: string | null
      prebuiltWithdrawalIntents: Intent[]
      withdrawalParams: WithdrawalParams
      nearIntentsNetwork: boolean
    }

export type IntentDescription =
  | {
      type: "swap"
      totalAmountIn: TokenValue
      totalAmountOut: TokenValue
      depositAddress?: string
    }
  | {
      type: "withdraw"
      tokenOut: BaseTokenInfo
      amountWithdrawn: TokenValue
      accountId: IntentsUserId
      chainName: SupportedChainName
      recipient: string
      nearIntentsNetwork: boolean
      withdrawalParams: WithdrawalParams
    }

type Context = {
  userAddress: string
  userChainType: AuthMethod
  defuseUserId: IntentsUserId
  referral?: string
  slippageBasisPoints: number
  nearClient: providers.Provider
  intentOperationParams: IntentOperationParams
  // The best quote that was actually published or will be published
  quoteToPublish: AggregatedQuote | null
  // Queue stores all quotes coming from the background quoter
  quotes: PriorityQueue<AggregatedQuote>
  messageToSign: null | {
    walletMessage: walletMessage.WalletMessage
    innerMessage: Nep413DefuseMessageFor_DefuseIntents
  }
  signature: walletMessage.WalletSignatureResult | null
  intentHash: string | null
  error: null | {
    tag: "err"
    value:
      | {
          reason:
            | "ERR_USER_DIDNT_SIGN"
            | "ERR_CANNOT_VERIFY_SIGNATURE"
            | "ERR_SIGNED_DIFFERENT_ACCOUNT"
            | "ERR_PUBKEY_EXCEPTION"
            | "ERR_CANNOT_PUBLISH_INTENT"
            | "ERR_QUOTE_EXPIRED_RETURN_IS_LOWER"
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
  userAddress: string
  userChainType: AuthMethod
  defuseUserId: IntentsUserId
  referral?: string
  slippageBasisPoints: number
  nearClient: providers.Provider
  intentOperationParams: IntentOperationParams
}

export type Output =
  | NonNullable<Context["error"]>
  | {
      tag: "ok"
      value: {
        intentHash: string
        intentDescription: IntentDescription
      }
    }

type Events = BackgroundQuoterEvents

export const swapIntentMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    output: {} as Output,
    events: {} as Events,
    // todo: this bloats size of types, typescript can't produce type definitions
    // children: {} as { publicKeyVerifierRef: "publicKeyVerifierActor" },
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
    proposeQuote: ({ context }, proposedQuote: AggregatedQuote) => {
      if (context.intentOperationParams.quote) {
        enqueueBetterQuote(
          context.quotes,
          context.intentOperationParams.quote,
          proposedQuote,
          context.intentOperationParams.tokenOut,
          context.slippageBasisPoints
        )
      }
    },
    emitSwapInitiated: ({ context }) => {
      const { intentOperationParams } = context
      if (intentOperationParams.type === "swap") {
        const { tokensIn } = intentOperationParams
        assert(tokensIn[0] != null)

        emitEvent("swap_initiated", {
          tokenDeltas: intentOperationParams.quote.tokenDeltas,
          token_from: intentOperationParams.tokenOut.symbol,
          token_to: tokensIn[0].symbol,
        })
      }
    },
    emitSwapConfirmed: ({ context }) => {
      const { intentOperationParams } = context
      if (intentOperationParams.type === "swap") {
        const { tokensIn } = intentOperationParams
        assert(tokensIn[0] != null)

        emitEvent("swap_confirmed", {
          tx_hash: context.intentHash,
          received_amount: intentOperationParams.quote.tokenDeltas,
        })
      }
    },
    assembleSignMessages: assign({
      messageToSign: ({ context }) => {
        assert(
          context.intentOperationParams.type === "swap",
          "Operation must be swap"
        )

        const innerMessage = messageFactory.makeInnerSwapMessage({
          tokenDeltas: accountSlippageExactIn(
            context.intentOperationParams.quote.tokenDeltas,
            context.slippageBasisPoints
          ),
          signerId: context.defuseUserId,
          deadlineTimestamp: Date.now() + settings.swapExpirySec * 1000,
          referral: context.referral,
          appFee: context.intentOperationParams.quote.appFee,
          appFeeRecipient: APP_FEE_RECIPIENT,
        })

        return {
          innerMessage,
          walletMessage: messageFactory.makeSwapMessage({ innerMessage }),
        }
      },
    }),
    setSignature: assign({
      signature: (_, signature: walletMessage.WalletSignatureResult | null) =>
        signature,
    }),
    setIntentHash: assign({
      intentHash: (_, intentHash: string) => intentHash,
    }),
    dequeueValidQuote: assign({
      quoteToPublish: ({ context }) => dequeueValidQuote(context.quotes),
    }),
  },
  actors: {
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
        throw new Error("not implemented")
      }
    ),
    broadcastMessage: fromPromise(
      async ({
        input,
      }: {
        input: {
          signatureData: walletMessage.WalletSignatureResult
          userInfo: { userAddress: string; userChainType: AuthMethod }
          quoteHashes: string[]
        }
      }) =>
        solverRelay
          .publishIntent(input.signatureData, input.userInfo, input.quoteHashes)
          .then(convertPublishIntentToLegacyFormat)
    ),
  },
  guards: {
    isSettled: (
      _,
      { status }: { status: "SETTLED" } | { status: "NOT_FOUND_OR_NOT_VALID" }
    ) => {
      return status === "SETTLED"
    },
    isIntentRelevant: ({ context }) => {
      const hadQuote = context.intentOperationParams.quote != null
      const hasQuote = context.quoteToPublish != null
      return hadQuote === hasQuote
    },
    isSigned: (_, params: walletMessage.WalletSignatureResult | null) =>
      params != null,
    isTrue: (_, params: boolean) => params,
    isOk: (_, params: { tag: "ok" } | { tag: "err" }) => params.tag === "ok",
    isQuoteOk: ({ event }) => {
      return event.params.quote.tag === "ok"
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwO4EMAOBaAlgOwBcxCBiAOQFEB1AfQEUBVAeQBUKBtABgF1FQMA9rBwEcAvHxAAPRACYAnAFYAdPIAcigGyKA7It0BGTcYDMAGhABPRAZOzlJxfJNqdmnTs7zOsgCwBffwtUTFxCYgJlHAgAGzASLl4kEEFhUXFJGQRbNWUfTgNfRVk1eU01Ut8LawQTdWVNP05HfU9fY0Dg9Gx8IkJlAGUcKDx8KBIIcTAovAA3AQBraeERgFk4WDQYRMlUkTEJZKzvZRLdV0bfWVkdAwNqxEaDVSKTO18dK7cTTpAQnvC-SGIzGJDAACdwQJwcoMDE0AQAGbQgC2yhWeHWsE22x4uyE+wyR0QWFkmk4ygqmhM1OMBm8dweCF8vnkyicrLKei0JVsv3+YT6kQAahCcIjLGMAAQABQArgAjGI4ADGUoA0mBLLLwXBiCr4pM8NN8PMlrDFcqVZrLKLweKcBCAEpgRE7ZJ7dKHUBZWQmVT09qFbxvLwGHRMgycHT2WRGErucn0-T87qCiLKO3iyV4KCyy2qjVanV6vAGiZTGZm6YYAvWrVZxGO8Eut0GJL8AlezJyMqUv1qO5RpxqD6aSN3XyqckKTjlQfRn5BP5p3oZxs5vPypWFm0l2D6+IQqEwuEI5HgtG1nf121ipvO13uztpA49hCkk5XeSfZzFOMFFUVg2JwnAqJoUYuDog6KEYHipqEa79AAQlCaAQCqaCwKIuZSgAkoCBAVsaVaLMsq6EcoqECOhmHYdKBFCggpoCJhXqJM+KRdm+xIILclKgS4fqKEU+gFJGHwqIojjRtc8gGBUnABMuApIZE1G0VhOF5oxERgpC0KwvCSKouiFFClRaEYVpDGEcxcysQiBwcXiHrcUSPokiU9g5B4+ilAY+juJGJhRqctxKaUajznoCEAhZG62UKCSuS+hLetIiDReyGiskpCkiWS47Adk1w+Y03yiWoSmKHF6b9IluG6aQ7Dtvir4eZltR+MoLKfBoZLSZo8iyCFPWhm8ziTbIxR1Wpmb3puUrAngCJyrqxEmg55qqZRjV5ita26vZ8xsc5PCcZ6PGed1yjfPksEiSyaijSVGgUmJnh1KB1LOHNe2LdKh0EOthqVixO3meugO4cDoMnY57EXW1bkdRlWRYCYvjPApZJhj+bweEyg72NGOgmHocafM0S5dIhAP2hKQPDKtIMbcehlniZl5mfTCUwwdLNHWACNneILkdlxaPvpjzSnGSFTyKyL2OPcJXGLkmjYxBSuFLY1yBMueACBAcCSLtQrtelMsuGyuPkvJBMUxGJV+myXhuPISgwUUyl0-FGbRHEVvdrxhQUpUrIxl7cbOK9NR2JovWyHOfjtErNxqP9FkrWMIfXV1Ci9VGvkU+Gui+OYJW+C9DhQUUhRlSNfsrnz0OM0t25WkW2oyrqB5lmA+edRjKheBULKBbB4blPITJx6csHDToShlNotOtwHKFWXR2n4YRw-o4guiqHU2gr3oHjlC7NT61O8kQU4dyKGobyaNn7fZklESH++Ub328UcHwTDRgqFoCcbxTguC0OUBQ2gfAf36AAYQECiOEYAiAQF-rxJQDh5xOH6iUGMxVb7Uh0A0cMoUp4iWjIgyIABxYgYo1QUAMuCbBN1SRawaJJCedx5JExKkYCmFDybP30L4WhKkoYNQFstIWbMh6o2trxaSd1mhuEUKBUchUgI1HJvYQcdRX5Y3UB4ZSgQgA */
  context: ({ input }) => {
    const quotes = makeQuotePriorityQueue(input.intentOperationParams.tokenOut)
    if (input.intentOperationParams.quote != null) {
      quotes.enqueue(input.intentOperationParams.quote)
    }

    return {
      messageToSign: null,
      signature: null,
      error: null,
      intentHash: null,
      quotes,
      quoteToPublish: null,
      ...input,
    }
  },

  id: "swap-intent",

  initial: "idle",

  output: ({ context }): Output => {
    if (context.intentHash != null) {
      const intentType = context.intentOperationParams.type
      switch (intentType) {
        case "swap": {
          const quote = context.quoteToPublish
          assert(quote != null, "Quote must be set for swap intent")

          return {
            tag: "ok",
            value: {
              intentHash: context.intentHash,
              intentDescription: {
                type: "swap",
                totalAmountIn: negateTokenValue(
                  computeTotalDeltaDifferentDecimals(
                    context.intentOperationParams.tokensIn,
                    quote.tokenDeltas
                  )
                ),
                totalAmountOut: computeTotalDeltaDifferentDecimals(
                  [context.intentOperationParams.tokenOut],
                  quote.tokenDeltas
                ),
              },
            },
          }
        }
        case "withdraw": {
          return {
            tag: "ok",
            value: {
              intentHash: context.intentHash,
              intentDescription: {
                type: "withdraw",
                tokenOut: context.intentOperationParams.tokenOut,
                amountWithdrawn: calcOperationAmountOut(
                  context.intentOperationParams,
                  context.quoteToPublish
                ),
                accountId: context.defuseUserId,
                chainName: context.intentOperationParams.tokenOut.chainName,
                recipient: context.intentOperationParams.recipient,
                nearIntentsNetwork:
                  context.intentOperationParams.nearIntentsNetwork,
                withdrawalParams:
                  context.intentOperationParams.withdrawalParams,
              },
            },
          }
        }
        default:
          intentType satisfies never
          throw new Error("exhaustive check failed")
      }
    }

    if (context.error != null) {
      return context.error
    }

    throw new Error("Unexpected output")
  },

  on: {
    NEW_QUOTE: {
      guard: "isQuoteOk",
      actions: [
        {
          type: "proposeQuote",
          params: ({ event }) => event.params.quote.value as AggregatedQuote,
        },
      ],
    },
  },
  states: {
    idle: {
      always: "Signing",
    },

    Signing: {
      entry: ["assembleSignMessages", "emitSwapInitiated"],

      invoke: {
        id: "signMessage",

        src: "signMessage",

        input: ({ context }) => {
          assert(context.messageToSign != null, "Sign message is not set")
          return context.messageToSign.walletMessage
        },

        onDone: {
          target: "Verifying Signature",

          actions: {
            type: "setSignature",
            params: ({ event }) => event.output,
          },
        },

        onError: {
          target: "Generic Error",
          description: "USER_DIDNT_SIGN",

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

    "Verifying Signature": {
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
            target: "Verifying Public Key Presence",
            guard: {
              type: "isTrue",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Generic Error",
            description: "SIGNED_DIFFERENT_ACCOUNT",
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
          target: "Generic Error",
          description: "ERR_CANNOT_VERIFY_SIGNATURE",

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

    "Verifying Public Key Presence": {
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
            target: "Verifying Intent",

            guard: {
              type: "isOk",
              params: ({ event }) => event.output,
            },
          },
          {
            target: "Generic Error",
            description: "ERR_PUBKEY_*",

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
          target: "Generic Error",
          description: "ERR_PUBKEY_EXCEPTION",

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

    "Broadcasting Intent": {
      invoke: {
        src: "broadcastMessage",

        input: ({ context }) => {
          assert(context.signature != null, "Signature is not set")
          assert(context.messageToSign != null, "Sign message is not set")

          let quoteHashes: string[] = []
          if (context.quoteToPublish) {
            quoteHashes = quoteHashes.concat(context.quoteToPublish.quoteHashes)
          }

          if (
            context.intentOperationParams.type === "withdraw" &&
            context.intentOperationParams.feeEstimation?.quote
          ) {
            quoteHashes = quoteHashes.concat(
              context.intentOperationParams.feeEstimation.quote.quote_hash
            )
          }

          return {
            signatureData: context.signature,
            userInfo: {
              userAddress: context.userAddress,
              userChainType: context.userChainType,
            },
            quoteHashes,
          }
        },

        onError: {
          target: "Generic Error",
          description: "CANNOT_PUBLISH_INTENT",

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
            target: "Generic Error",
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
      },
    },

    "Verifying Intent": {
      entry: "dequeueValidQuote",
      always: [
        {
          target: "Broadcasting Intent",
          guard: "isIntentRelevant",
        },
        {
          target: "Completed",
          description: "QUOTE_EXPIRED_RETURN_IS_LOWER",

          actions: [
            {
              type: "setError",
              params: {
                reason: "ERR_QUOTE_EXPIRED_RETURN_IS_LOWER",
                error: null,
              },
            },
          ],
        },
      ],
    },

    Completed: {
      type: "final",
      entry: ["emitSwapConfirmed"],
    },

    "Generic Error": {
      type: "final",
    },
  },
})

function enqueueBetterQuote(
  quotes: PriorityQueue<AggregatedQuote>,
  originalQuote: AggregatedQuote,
  proposedQuote: AggregatedQuote,
  tokenOut: BaseTokenInfo,
  slippageBasisPoints: number
) {
  const outOriginal = computeTotalDeltaDifferentDecimals(
    [tokenOut],
    accountSlippageExactIn(originalQuote.tokenDeltas, slippageBasisPoints)
  )

  const outProposed = computeTotalDeltaDifferentDecimals(
    [tokenOut],
    proposedQuote.tokenDeltas
  )

  if (compareAmounts(outOriginal, outProposed) <= 0) {
    quotes.enqueue(proposedQuote)
  }
}

function dequeueValidQuote(
  quotes: PriorityQueue<AggregatedQuote>
): AggregatedQuote | null {
  const MIN_BUFFER_TIME_MS = 10_000 // 10 seconds

  while (!quotes.isEmpty()) {
    const quote = quotes.dequeue()
    if (
      // We take a quote that won't expire in the next 10 seconds, so we have time to broadcast the intent
      Date.now() + MIN_BUFFER_TIME_MS <
      new Date(quote.expirationTime).getTime()
    ) {
      return quote
    }
  }

  return null
}

export function calcOperationAmountOut(
  operation: IntentOperationParams,
  quoteToPublish: AggregatedQuote | null
): TokenValue {
  const operationType = operation.type
  switch (operationType) {
    case "swap": {
      assert(quoteToPublish != null, "Quote must be set for swap operation")
      return computeTotalDeltaDifferentDecimals(
        [operation.tokenOut],
        quoteToPublish.tokenDeltas
      )
    }

    case "withdraw": {
      return calcWithdrawAmount(
        operation.tokenOut,
        quoteToPublish,
        operation.feeEstimation,
        operation.directWithdrawalAmount
      ).withdrawAmount
    }

    default:
      operationType satisfies never
      throw new Error("exhaustive check failed")
  }
}

export function calcWithdrawAmount(
  tokenOut: BaseTokenInfo,
  swapInfo: AggregatedQuote | null,
  feeEstimation: Pick<FeeEstimation, "amount">,
  directWithdrawalAmount: TokenValue
): {
  withdrawAmount: TokenValue
  withdrawFee: TokenValue
} {
  const gotFromSwap =
    swapInfo == null
      ? { amount: 0n, decimals: 0 }
      : computeTotalDeltaDifferentDecimals([tokenOut], swapInfo.tokenDeltas)

  const feeAmount: TokenValue = {
    amount: feeEstimation.amount,
    decimals: tokenOut.decimals,
  }

  return {
    withdrawAmount: subtractAmounts(
      addAmounts(directWithdrawalAmount, gotFromSwap),
      feeAmount
    ),
    withdrawFee: feeAmount,
  }
}

function makeQuotePriorityQueue(tokenOut: BaseTokenInfo) {
  return new PriorityQueue<AggregatedQuote>((quoteA, quoteB) => {
    const amountOutA = computeTotalDeltaDifferentDecimals(
      [tokenOut],
      quoteA.tokenDeltas
    )
    const amountOutB = computeTotalDeltaDifferentDecimals(
      [tokenOut],
      quoteB.tokenDeltas
    )
    return compareAmounts(amountOutB, amountOutA)
  })
}
