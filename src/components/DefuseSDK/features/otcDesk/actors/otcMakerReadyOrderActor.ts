import type { MultiPayload } from "@defuse-protocol/contract-types"
import { logger } from "@src/utils/logger"
import { type PromiseActorLogic, assign, setup } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import type { BaseTokenInfo, TokenInfo, TokenValue } from "../../../types/base"
import {
  type OTCMakerOrderCancellationActorInput,
  type OTCMakerOrderCancellationActorOutput,
  otcMakerOrderCancellationActor,
} from "./otcMakerOrderCancellationActor"

export type OTCMakerReadyOrderActorInput = {
  parsed: {
    tokenIn: TokenInfo
    tokenOut: BaseTokenInfo
    amountIn: TokenValue
    amountOut: TokenValue
  }
  raw: {
    tokenIn: TokenInfo
    tokenOut: TokenInfo
    amountIn: string
    amountOut: string
  }
  tradeId: string
  usedNonceBase64: string
  multiPayload: MultiPayload
  signerCredentials: SignerCredentials
  pKey: string
  iv: string
}

type OTCMakerReadyOrderActorErrors = { reason: "EXCEPTION" }

interface OTCMakerReadyOrderActorContext extends OTCMakerReadyOrderActorInput {
  tradeId: string
  usedNonceBase64: string
  pKey: string
  iv: string
  error: null | OTCMakerReadyOrderActorErrors
}

export const otcMakerReadyOrderActor = setup({
  types: {
    input: {} as OTCMakerReadyOrderActorInput,
    context: {} as OTCMakerReadyOrderActorContext,
    events: {} as { type: "FINISH" | "CANCEL_ORDER" },
    children: {} as {
      otcMakerOrderCancellationRef: "cancelOrderActor"
    },
  },
  actors: {
    cancelOrderActor:
      otcMakerOrderCancellationActor as unknown as PromiseActorLogic<
        OTCMakerOrderCancellationActorOutput,
        OTCMakerOrderCancellationActorInput
      >,
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (_, error: OTCMakerReadyOrderActorErrors) => error,
    }),
  },
  guards: {
    isTrue: (_, value: boolean) => value,
  },
}).createMachine({
  context: ({ input }) => ({
    ...input,
    error: null,
  }),

  initial: "idle",

  states: {
    idle: {
      on: {
        FINISH: "finished",
        CANCEL_ORDER: "cancellingOrder",
      },
    },

    cancellingOrder: {
      invoke: {
        id: "otcMakerOrderCancellationRef",
        src: "cancelOrderActor",
        input: ({ context }) => ({
          tradeId: context.tradeId,
          nonceBas64: context.usedNonceBase64,
          signerCredentials: context.signerCredentials,
        }),
        onDone: [
          {
            target: "finished",
            guard: {
              type: "isTrue",
              params: ({ event }) =>
                event.output.orderStatus === "cancelled" ||
                event.output.orderStatus === "already_cancelled_or_executed",
            },
          },
          "idle",
        ],
        onError: {
          target: "idle",
          actions: [
            { type: "logError", params: ({ event }) => event },
            { type: "setError", params: { reason: "EXCEPTION" } },
          ],
        },
      },
    },

    finished: {
      type: "final",
    },
  },
})
