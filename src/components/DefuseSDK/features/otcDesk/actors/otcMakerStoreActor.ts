import { fromPromise, setup } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import type { CreateOtcTrade } from "../types/sharedTypes"

export type OtcMakerStoreActorInput = {
  multiPayload: MultiPayload
  signerCredentials: SignerCredentials
  usedNonceBase64: string
  createOtcTrade: CreateOtcTrade
}

export type OtcMakerStoreActorOutput =
  | { tag: "err"; value: OtcMakerStoreActorErrors }
  | { tag: "ok"; value: OtcMakerStoreActorSuccess }

export interface OtcMakerStoreActorSuccess extends OtcMakerStoreActorInput {
  tradeId: string
  pKey: string
  iv: string
}

export type OtcMakerStoreActorErrors = { reason: "ERR_STORE_FAILED" }

export const otcMakerStoreActor = setup({
  types: {
    input: {} as OtcMakerStoreActorInput,
    context: {} as OtcMakerStoreActorInput,
  },
  actors: {
    createOtcTrade: fromPromise(
      ({ input }: { input: OtcMakerStoreActorInput }) =>
        input
          .createOtcTrade(input.multiPayload)
          .then((tradeId) => {
            return { tag: "ok", value: tradeId }
          })
          .catch(() => {
            return { tag: "err", value: { reason: "ERR_STORE_FAILED" } }
          })
    ),
  },
  actions: {
    complete: ({ event }) => event.output,
  },
}).createMachine({
  initial: "storing",

  context: ({ input }) => input,

  output: ({ event }) => {
    return event.output as OtcMakerStoreActorOutput
  },

  states: {
    storing: {
      invoke: {
        src: "createOtcTrade",
        input: ({ context }) => {
          return {
            multiPayload: context.multiPayload,
            signerCredentials: context.signerCredentials,
            usedNonceBase64: context.usedNonceBase64,
            createOtcTrade: context.createOtcTrade,
          }
        },

        onDone: {
          target: "#(machine).completed",
          actions: "complete",
        },

        onError: {
          target: "#(machine).completed",
          actions: "complete",
        },
      },
    },
    completed: {
      type: "final",
      output: ({ context, event }): OtcMakerStoreActorOutput => {
        if (event.output.tag === "err") {
          return event.output
        }
        return {
          tag: "ok",
          value: {
            ...context,
            tradeId: event.output.value.tradeId,
            pKey: event.output.value.pKey,
            iv: event.output.value.iv,
          },
        }
      },
    },
  },
})
