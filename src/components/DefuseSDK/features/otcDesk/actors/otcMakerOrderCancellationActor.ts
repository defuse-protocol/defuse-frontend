import type { MultiPayload } from "@defuse-protocol/contract-types"
import { solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { createEmptyIntentMessage } from "@src/components/DefuseSDK/core/messages"
import { assertEvent, assign, fromPromise, setup } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import {
  type PublishIntentsErr,
  convertPublishIntentsToLegacyFormat,
} from "../../../sdk/solverRelay/publishIntents"
import { assert } from "../../../utils/assert"
import {
  type Errors as SignIntentErrors,
  type Output as SignIntentOutput,
  signIntentMachine,
} from "../../machines/signIntentMachine"
import { otcMakerTradesStore } from "../stores/otcMakerTrades"
import type { SignMessage } from "../types/sharedTypes"

export type OTCMakerOrderCancellationActorInput = {
  tradeId: string
  nonceBas64: string
  signerCredentials: SignerCredentials
}

export type OTCMakerOrderCancellationActorOutput = {
  orderStatus: "cancelled" | "not_cancelled" | "already_cancelled_or_executed"
}

type OTCMakerOrderCancellationActorErrors =
  | SignIntentErrors
  | PublishIntentsErr
  | { reason: "EXCEPTION" }

type OTCMakerOrderCancellationActorContext = {
  tradeId: string
  nonceBas64: string
  signerCredentials: SignerCredentials
  error: null | OTCMakerOrderCancellationActorErrors
}

export const otcMakerOrderCancellationActor = setup({
  types: {
    input: {} as OTCMakerOrderCancellationActorInput,
    output: {} as OTCMakerOrderCancellationActorOutput,
    context: {} as OTCMakerOrderCancellationActorContext,
    events: {} as
      | {
          type: "ABORT_CANCELLATION" | "ACK_CANCELLATION_IMPOSSIBLE"
        }
      | {
          type: "CONFIRM_CANCELLATION"
          signerCredentials: SignerCredentials
          signMessage: SignMessage
        }
      | {
          type: "_INTERNAL_SIGNED"
          multiPayload: MultiPayload
          signatureResult: walletMessage.WalletSignatureResult
          signerCredentials: SignerCredentials
        },
  },
  actors: {
    signActor: signIntentMachine,
    publishActor: fromPromise(
      ({ input }: { input: { multiPayload: MultiPayload } }) => {
        return solverRelay
          .publishIntents({
            quote_hashes: [],
            signed_datas: [input.multiPayload],
          })
          .then(convertPublishIntentsToLegacyFormat)
          .then((result) => {
            if (result.isErr()) {
              return { tag: "err" as const, value: result.unwrapErr() }
            }
            const intentHashes = result.unwrap()
            const intentHash = intentHashes[0]
            assert(intentHash != null)
            return { tag: "ok" as const, value: intentHash }
          })
      }
    ),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (_, error: OTCMakerOrderCancellationActorErrors) => error,
    }),
    clearError: assign({ error: null }),

    completeSigning: ({ self }, event: { output: SignIntentOutput }) => {
      assert(event.output.tag === "ok")
      self.send({ type: "_INTERNAL_SIGNED", ...event.output.value })
    },

    removeTrade: ({ context }) => {
      otcMakerTradesStore
        .getState()
        .removeTrade(context.tradeId, context.signerCredentials)
    },
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
    isNonceUsedError: (
      _,
      event: {
        output: { tag: "err"; value: PublishIntentsErr } | { tag: "ok" }
      }
    ) => {
      return (
        event.output.tag === "err" &&
        event.output.value.reason === "RELAY_PUBLISH_NONCE_USED"
      )
    },
  },
}).createMachine({
  context: ({ input }) => ({
    ...input,
    error: null,
  }),

  output: ({ event }) => {
    return event.output as OTCMakerOrderCancellationActorOutput
  },

  initial: "idle",

  states: {
    idle: {
      on: {
        CONFIRM_CANCELLATION: "cancelling",
        ABORT_CANCELLATION: "aborted",
      },
    },

    idleUncancellable: {
      on: {
        ACK_CANCELLATION_IMPOSSIBLE: "uncancellable",
      },
    },

    cancelling: {
      entry: "clearError",

      initial: "signing",

      states: {
        signing: {
          invoke: {
            id: "signRef",
            src: "signActor",

            input: ({ context, event }) => {
              assertEvent(event, "CONFIRM_CANCELLATION")

              return {
                walletMessage: createEmptyIntentMessage({
                  signerId: event.signerCredentials,
                  nonce: base64.decode(context.nonceBas64),
                }),
                signerCredentials: event.signerCredentials,
                signMessage: event.signMessage,
              }
            },

            onError: {
              target: "#(machine).idle",
              actions: [
                { type: "logError", params: ({ event }) => event },
                { type: "setError", params: { reason: "EXCEPTION" } },
              ],
            },

            onDone: [
              {
                guard: { type: "isOk", params: ({ event }) => event.output },
                actions: {
                  type: "completeSigning",
                  params: ({ event }) => event,
                },
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
            src: "publishActor",

            input: ({ event }) => {
              assertEvent(event, "_INTERNAL_SIGNED")

              return {
                signerCredentials: event.signerCredentials,
                signature: event.signatureResult,
                multiPayload: event.multiPayload,
              }
            },

            onError: {
              target: "#(machine).idle",
              actions: [
                { type: "logError", params: ({ event }) => event },
                { type: "setError", params: { reason: "EXCEPTION" } },
              ],
            },

            onDone: [
              {
                target: "#(machine).cancelled",
                guard: {
                  type: "isOk",
                  params: ({ event }) => event.output,
                },
                actions: "removeTrade",
              },
              {
                target: "#(machine).idleUncancellable",
                guard: {
                  type: "isNonceUsedError",
                  params: ({ event }) => event,
                },
                actions: "removeTrade",
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
        },
      },
    },

    cancelled: {
      type: "final",
      output: {
        orderStatus: "cancelled",
      } satisfies OTCMakerOrderCancellationActorOutput,
    },

    uncancellable: {
      type: "final",
      output: {
        orderStatus: "already_cancelled_or_executed",
      } satisfies OTCMakerOrderCancellationActorOutput,
    },

    aborted: {
      type: "final",
      output: {
        orderStatus: "not_cancelled",
      } satisfies OTCMakerOrderCancellationActorOutput,
    },
  },
})
