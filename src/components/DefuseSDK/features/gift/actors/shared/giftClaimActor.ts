import { solverRelay } from "@defuse-protocol/internal-utils"
import {
  type SignerCredentials,
  formatSignedIntent,
} from "@src/components/DefuseSDK/core/formatters"
import type { MultiPayload } from "@src/components/DefuseSDK/types/defuse-contracts-types"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import { logger } from "../../../../logger"
import {
  type PublishIntentsErr,
  convertPublishIntentsToLegacyFormat,
} from "../../../../sdk/solverRelay/publishIntents"
import { assert } from "../../../../utils/assert"
import { signGiftTakerMessage } from "../../utils/signGiftTakerMessage"
import type { GiftInfo } from "./getGiftInfo"

export type GiftClaimActorOutput =
  | {
      giftStatus: "claimed"
      intentHashes: string[]
    }
  | {
      giftStatus: "not_claimed" | "already_claimed_or_executed"
    }

export type GiftClaimActorErrors =
  | PublishIntentsErr
  | {
      reason:
        | "ERR_ON_CLAIM_GIFT"
        | "ERR_ON_SIGN_GIFT"
        | "ERR_ON_PUBLISH_GIFT"
        | "NOT_FOUND_OR_NOT_VALID"
    }

type GiftSignGiftActorOutput =
  | {
      tag: "ok"
      value: { multiPayload: MultiPayload }
    }
  | { tag: "err"; value: GiftClaimActorErrors }

type GiftPublishActorOutput =
  | {
      tag: "ok"
      value: {
        intentHashes: string[]
      }
    }
  | {
      tag: "err"
      value: GiftClaimActorErrors
    }

type GiftClaimActorContext = {
  giftInfo: null | GiftInfo
  error: null | GiftClaimActorErrors
  signerCredentials: null | SignerCredentials
  addIntentHashes: null | string[]
}

export const giftClaimActor = setup({
  types: {
    output: {} as GiftClaimActorOutput,
    context: {} as GiftClaimActorContext,
    events: {} as
      | {
          type: "ABORT_CLAIM" | "ACK_CLAIM_IMPOSSIBLE"
        }
      | {
          type: "CONFIRM_CLAIM"
          params: {
            giftInfo: GiftInfo
            signerCredentials: SignerCredentials
          }
        }
      | {
          type: "_INTERNAL_SIGNED"
          params: {
            multiPayload: MultiPayload
          }
        },
  },
  actors: {
    signGiftActor: fromPromise(
      async ({
        input,
      }: {
        input: { giftInfo: GiftInfo; signerCredentials: SignerCredentials }
      }): Promise<GiftSignGiftActorOutput> => {
        try {
          const signature = await signGiftTakerMessage({
            giftInfo: input.giftInfo,
            signerCredentials: input.signerCredentials,
          })
          const multiPayload = formatSignedIntent(
            signature,
            input.signerCredentials
          )
          return {
            tag: "ok",
            value: {
              multiPayload,
            },
          }
        } catch {
          return {
            tag: "err",
            value: { reason: "ERR_ON_SIGN_GIFT" },
          }
        }
      }
    ),
    publishGiftActor: fromPromise(
      async ({
        input,
      }: {
        input: { multiPayload: MultiPayload }
      }): Promise<GiftPublishActorOutput> => {
        const result = await solverRelay
          .publishIntents({
            quote_hashes: [],
            signed_datas: [input.multiPayload],
          })
          .then(convertPublishIntentsToLegacyFormat)
        if (result.isErr()) {
          return { tag: "err" as const, value: result.unwrapErr() }
        }
        const intentHashes = result.unwrap()
        if (intentHashes.length === 0) {
          return {
            tag: "err" as const,
            value: { reason: "ERR_ON_PUBLISH_GIFT" },
          }
        }
        return {
          tag: "ok",
          value: { intentHashes },
        }
      }
    ),
    settlingActor: fromPromise(
      async ({
        input,
        signal,
      }: {
        input: { intentHashes: string[] }
        signal: AbortSignal
      }): Promise<
        { tag: "ok" } | { tag: "err"; value: GiftClaimActorErrors }
      > => {
        const intentHash = input.intentHashes[0]
        assert(intentHash, "intentHash is not defined")
        try {
          await solverRelay.waitForIntentSettlement({
            signal,
            intentHash,
          })
          return { tag: "ok" as const }
        } catch (err) {
          if (err instanceof solverRelay.IntentSettlementError) {
            return {
              tag: "err" as const,
              value: { reason: "NOT_FOUND_OR_NOT_VALID" },
            }
          }
          // Optionally handle/log other error types here
          throw err
        }
      }
    ),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (_, error: GiftClaimActorErrors) => error,
    }),
    clearError: assign({ error: null }),
    completeSigning: (
      { self },
      event: { output: { tag: "ok"; value: { multiPayload: MultiPayload } } }
    ) => {
      assert(event.output.tag === "ok")
      self.send({ type: "_INTERNAL_SIGNED", params: event.output.value })
    },
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlwgBswBiAYQHkA5AMQEkAlAWQH1aAZAIKtOAbQAMAXUSgADgHtYuAC645+aSAAeiAIw6ATAHYS+gGxiALIYCcOgBwH9OiwBoQAT0QBmMSTGHTL0MxMVM7AFYAiy8AXxi3NCw8QlJyKmoBACF6dgAVXkFhcSkkEHlFFTUNbQQ9IL99J1NTQ2jrUws7N08EcP1wkgd+zosxMzsvCziEjBwCYjJKMABVfEwKdFwMACN0gVoAaQKhHmEABXoAZUvWTL4AUWKNcuVVdVKajusSL0mg350-kM9m6iDs-kG4VM4QmlgB4Vi8RAiTmKRI602qAIUBIiig+Gx1AgajAZHwADc5ABrUl4-AAcVwADMlOwwEynqUXpV3qAalYBqZrIYnNYYfpJuEdKZQQgOiRoeCWiF9HY7GZTNNkbNkgsMVtsbjcPjCcTCGTKTSjfjGSy2RydCVZApXlUPmCJSY7BZmi0bE4dOFZfYLCYWtY7NYxOCvBNDIiZkl5qR9Vj8Di6YSwAAnbNybMkGQbJRM-Ooa0M5ms9mc50VN7VRDxwYR2xCqztwPB4IkGzOCzCgJiLxRhPapNo1OGzPp6jcViMXL3diMAR8bg3emMe4AEVrZRdPMbCF+odjeiM1i8+ks1n6soBJGi4OBhnB1ls4S1KN1KY2BvTQsAFddlwWBkigIkSQtalSRkECKDA7BbWrDlJGeQ8G3dBB9A-BUvHCMYbxhWEug8RBIn0QZJgjRoOjfAjvx1ZN0X-NMcXg0DwNNaCCEtOCEKQlD7RER0MPrN0+UQUwdGMcILD6QxwmUyMER0WVKOogd1TMKwJi-JEfxYqdAM4xDuNnHM8wLIt0BLMtgK45CqxE9CuUwyStGk0NCPVeNRiMCxHFlUZfCMEUHF+JxCMsOIkXwOQIDgDQjJScTXV5LyEAAWi8HQn1sEVoWFfo7EMAJZWywNjEmHRbHsGwgp9fQmInBY0jAdKj2wvRyp+eNgUiAib0jWViN7CwFMmjpRWCKZDOYtEOtWVN0F2Tr3IkzLPgiBVA3MCMQgRQxZVfEgDDqvpAWlD87Fa1E9TY7EuqwqTalMEhfKMSYxlaRxXHInKhUGIKowiHQCJFWN7t-VjMWnY0CXTF7PJqVU7CfPK720j9SuDdUTEmhEyq8Zp5M1Ba2r-eHTMEiyoBR7bEDMb5oQUuxmmiIKpQBnogvy+NLDEdoHBFYEYeMtjIEZ49Sao69+nk0mRwlMieijAYxlHSG1RkgzEwe0ggLWNi1qoGXsLCfLAilWNwnaQXrFlDWGijEUHZ06wJbRNb8yUaXNoy489AUn4fRHb0WihIxnbETXcP8XCWk9uKYiAA */
  context: {
    error: null,
    addIntentHashes: null,
    signerCredentials: null,
    giftInfo: null,
  },

  initial: "idle",

  output: ({ event }) => {
    return event.output as GiftClaimActorOutput
  },

  states: {
    idle: {
      on: {
        CONFIRM_CLAIM: "claiming",
        ABORT_CLAIM: "aborted",
      },
    },

    idleUnclaimable: {
      on: {
        ACK_CLAIM_IMPOSSIBLE: "unclaimable",
      },
    },

    claiming: {
      entry: "clearError",

      initial: "signing",

      states: {
        signing: {
          invoke: {
            id: "signGiftRef",
            src: "signGiftActor",

            input: ({ event }) => {
              assertEvent(event, "CONFIRM_CLAIM")
              return {
                giftInfo: event.params.giftInfo,
                signerCredentials: event.params.signerCredentials,
              }
            },

            onError: {
              target: "#(machine).claiming",
              actions: [
                { type: "logError", params: ({ event }) => event },
                { type: "setError", params: { reason: "ERR_ON_SIGN_GIFT" } },
              ],
            },

            onDone: [
              {
                guard: {
                  type: "isOk",
                  params: ({ event }) => {
                    const output = event.output
                    return { tag: output.tag }
                  },
                },
                actions: [
                  {
                    type: "completeSigning",
                    params: ({ event }) => {
                      assert(event.output.tag === "ok")
                      return {
                        output: { tag: "ok", value: event.output.value },
                      }
                    },
                  },
                ],
              },
              {
                target: "#(machine).idle",
                actions: {
                  type: "setError",
                  params: ({ event }) => {
                    assert(event.output.tag === "err")
                    return event.output.value
                  },
                },
              },
            ],
          },

          on: {
            _INTERNAL_SIGNED: {
              target: "publishing",
            },
          },
        },

        publishing: {
          invoke: {
            id: "publishGiftRef",
            src: "publishGiftActor",

            input: ({ event }) => {
              assertEvent(event, "_INTERNAL_SIGNED")
              return {
                multiPayload: event.params.multiPayload,
              }
            },

            onError: {
              target: "#(machine).claiming",
              actions: [
                { type: "logError", params: ({ event }) => event },
                { type: "setError", params: { reason: "ERR_ON_PUBLISH_GIFT" } },
              ],
            },

            onDone: [
              {
                target: "settling",
                guard: {
                  type: "isOk",
                  params: ({ event }) => event.output,
                },
                actions: assign({
                  addIntentHashes: ({ event }) => {
                    assert(event.output.tag === "ok")
                    return event.output.value.intentHashes
                  },
                }),
              },
              {
                target: "#(machine).idleUnclaimable",
                actions: {
                  type: "setError",
                  params: ({ event }) => {
                    const output = event.output as {
                      tag: "err"
                      value: GiftClaimActorErrors
                    }
                    assert(output.tag === "err")
                    return output.value
                  },
                },
              },
            ],
          },
        },

        settling: {
          invoke: {
            src: "settlingActor",
            input: ({ context }) => {
              assert(context.addIntentHashes, "addIntentHashes is not defined")
              return {
                intentHashes: context.addIntentHashes,
              }
            },

            onError: {
              target: "#(machine).claiming",
              actions: [
                { type: "logError", params: ({ event }) => event },
                {
                  type: "setError",
                  params: { reason: "NOT_FOUND_OR_NOT_VALID" },
                },
              ],
            },

            onDone: [
              {
                target: "#(machine).claimed",
                guard: {
                  type: "isOk",
                  params: ({ event }) => {
                    const output = event.output
                    return { tag: output.tag }
                  },
                },
              },
              {
                target: "#(machine).idleUnclaimable",
                actions: {
                  type: "setError",
                  params: ({ event }) => {
                    const output = event.output as {
                      tag: "err"
                      value: GiftClaimActorErrors
                    }
                    assert(output.tag === "err")
                    return output.value
                  },
                },
              },
            ],
          },
        },
      },
    },

    claimed: {
      type: "final",
      output: ({ context }) => ({
        giftStatus: "claimed",
        intentHashes: context.addIntentHashes,
      }),
    },

    unclaimable: {
      type: "final",
      output: {
        giftStatus: "already_claimed_or_executed",
      },
    },

    aborted: {
      type: "final",
      output: {
        giftStatus: "not_claimed",
      },
    },
  },
})
