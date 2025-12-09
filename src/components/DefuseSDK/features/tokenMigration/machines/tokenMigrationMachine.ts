import { VersionedNonceBuilder } from "@defuse-protocol/intents-sdk"
import { messageFactory, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { salt } from "@src/components/DefuseSDK/services/intentsContractService"
import { logger } from "@src/utils/logger"
import { assign, fromPromise, setup } from "xstate"
import { config } from "../../../config"
import { nearClient } from "../../../constants/nearClient"
import type { SignerCredentials } from "../../../core/formatters"
import { convertPublishIntentToLegacyFormat } from "../../../sdk/solverRelay/utils/parseFailedPublishError"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import type { IntentsUserId } from "../../../types/intentsUserId"
import { assert } from "../../../utils/assert"
import { signIntentMachine } from "../../machines/signIntentMachine"
import type { SignMessage } from "../../otcDesk/types/sharedTypes"
import type { TokenBalances } from "../../otcDesk/utils/fillWithMinimalExchanges"
import { tokensToMigrate } from "../config"
import { getTokenAccountId } from "../utils"

export const tokenMigrationMachine = setup({
  types: {
    input: {} as {
      userId: IntentsUserId
      signerCredentials: SignerCredentials
      signMessage: SignMessage
    },
    context: {} as {
      userId: IntentsUserId
      signerCredentials: SignerCredentials
      signMessage: SignMessage
      tokensToMigrate: TokenBalances
      signature: null | walletMessage.WalletSignatureResult
      walletMessage: null | walletMessage.WalletMessage
      intentHash: null | string
      error: null | string
      intentStatus: null | solverRelay.WaitForIntentSettlementReturnType
    },
  },

  actors: {
    getBalances: fromPromise(
      ({ input }: { input: { userId: IntentsUserId } }) => {
        return getDepositedBalances(
          input.userId,
          tokensToMigrate,
          nearClient
        ).then((balances) => {
          return Object.fromEntries(
            Object.entries(balances).filter(([, amount]) => amount !== 0n)
          )
        })
      }
    ),
    prepareWalletMessage: fromPromise(
      async ({
        input,
      }: {
        input: { userId: IntentsUserId; tokensToMigrate: TokenBalances }
      }): Promise<walletMessage.WalletMessage> => {
        const deadline = new Date(Date.now() + 5 * 60 * 1000).toISOString()
        const nonce = base64.decode(
          VersionedNonceBuilder.encodeNonce(
            await salt({ nearClient }),
            new Date(deadline)
          )
        )

        const walletMessage = messageFactory.makeSwapMessage({
          innerMessage: {
            signer_id: input.userId,
            deadline,
            intents: Object.entries(input.tokensToMigrate).map(
              ([tokenId, amount]) => ({
                intent: "ft_withdraw",
                token: getTokenAccountId(tokenId),
                receiver_id: config.env.contractID,
                amount: amount.toString(),
                memo: "Migrate ETH: aurora -> eth.bridge.near",
                msg: input.userId,
              })
            ),
          },
          nonce,
        })
        return walletMessage
      }
    ),

    signIntent: signIntentMachine,

    publishIntent: fromPromise(
      ({ input }: { input: Parameters<typeof solverRelay.publishIntent> }) =>
        solverRelay
          .publishIntent(...input)
          .then(convertPublishIntentToLegacyFormat)
    ),

    waitForIntentSettlement: fromPromise(
      ({
        input,
        signal,
      }: { input: { intentHash: string }; signal: AbortSignal }) =>
        solverRelay
          .waitForIntentSettlement({ signal, intentHash: input.intentHash })
          .then((result) => ({
            ...result,
            status:
              result.txHash != null ? "SETTLED" : "NOT_FOUND_OR_NOT_VALID",
          }))
    ),
  },

  actions: {
    clearError: assign({
      error: null,
    }),
  },
}).createMachine({
  initial: "gettingBalances",

  context: ({ input }) => ({
    ...input,
    tokensToMigrate: {},
    signature: null,
    intentHash: null,
    error: null,
    intentStatus: null,
    walletMessage: null,
  }),

  states: {
    gettingBalances: {
      invoke: {
        src: "getBalances",

        input: ({ context }) => ({
          userId: context.userId,
        }),

        onDone: [
          {
            guard: ({ event }) => Object.keys(event.output).length > 0,
            target: "migrating",
            actions: assign({
              tokensToMigrate: ({ event }) => event.output,
            }),
          },
          {
            target: "finished",
          },
        ],

        onError: {
          target: "finished",
          actions: ({ event }) => {
            logger.error(event.error)
          },
        },
      },
    },

    migrating: {
      initial: "idle",

      states: {
        idle: {
          on: {
            PROCEED: {
              target: "signing",
              actions: "clearError",
            },
            CANCEL: "#(machine).finished",
          },
        },

        prepareWalletMessageToSign: {
          invoke: {
            src: "prepareWalletMessage",

            input: ({ context }) => {
              return {
                userId: context.userId,
                tokensToMigrate: context.tokensToMigrate,
              }
            },

            onDone: [
              {
                target: "signing",
                actions: assign({
                  walletMessage: ({ event }) => event.output,
                }),
              },
            ],

            onError: {
              target: "idle",
              actions: [
                ({ event }) => {
                  logger.error(event.error)
                },
                assign({
                  error: "EXCEPTION",
                }),
              ],
            },
          },
        },

        signing: {
          invoke: {
            src: "signIntent",

            input: ({ context }) => {
              assert(context.walletMessage !== null)
              return {
                signerCredentials: context.signerCredentials,
                signMessage: context.signMessage,
                walletMessage: context.walletMessage,
              }
            },

            onDone: [
              {
                guard: ({ event }) => event.output.tag === "ok",
                target: "publishing",
                actions: assign({
                  signature: ({ event }) => {
                    assert(event.output.tag === "ok")
                    return event.output.value.signatureResult
                  },
                }),
              },
              {
                target: "idle",
                actions: [
                  assign({
                    error: ({ event }) => {
                      assert(event.output.tag === "err")
                      return event.output.value.reason
                    },
                  }),
                ],
              },
            ],

            onError: {
              target: "idle",
              actions: [
                ({ event }) => {
                  logger.error(event.error)
                },
                assign({
                  error: "EXCEPTION",
                }),
              ],
            },
          },
          tags: ["busy"],
        },

        publishing: {
          invoke: {
            src: "publishIntent",

            input: ({ context }) => {
              assert(context.signature != null)
              return [
                context.signature,
                {
                  userAddress: context.signerCredentials.credential,
                  userChainType: context.signerCredentials.credentialType,
                },
                [],
              ]
            },

            onDone: [
              {
                guard: ({ event }) => event.output.tag === "ok",
                target: "settling",
                actions: [
                  assign({
                    signature: null,
                    intentHash: ({ event }) => {
                      assert(event.output.tag === "ok")
                      return event.output.value
                    },
                  }),
                ],
              },
              {
                target: "idle",
                actions: [
                  assign({
                    error: ({ event }) => {
                      assert(event.output.tag === "err")
                      return event.output.value.reason
                    },
                  }),
                ],
              },
            ],

            onError: {
              target: "idle",
              actions: [
                ({ event }) => {
                  logger.error(event.error)
                },
                assign({
                  error: "EXCEPTION",
                }),
              ],
            },
          },
          tags: ["busy"],
        },

        settling: {
          invoke: {
            src: "waitForIntentSettlement",

            input: ({ context }) => {
              assert(context.intentHash != null)
              return { intentHash: context.intentHash }
            },

            onDone: [
              {
                guard: ({ event }) => event.output.status === "SETTLED",
                target: "settled",
                actions: [
                  assign({
                    intentStatus: ({ event }) => event.output,
                  }),
                ],
              },
              {
                target: "idle",
                actions: [
                  assign({
                    error: "CANT_GET_INTENT_STATUS",
                  }),
                ],
              },
            ],

            onError: {
              target: "idle",
              actions: [
                ({ event }) => {
                  logger.error(event.error)
                },
                assign({
                  error: "EXCEPTION",
                }),
              ],
            },
          },
          tags: ["busy"],
        },

        settled: {
          on: {
            OK: "#(machine).finished",
          },
        },
      },
    },

    finished: {
      type: "final",
    },
  },
})
