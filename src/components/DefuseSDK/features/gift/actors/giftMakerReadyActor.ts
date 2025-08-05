import { assert } from "@src/components/DefuseSDK/utils/assert"
import { type PromiseActorLogic, assign, fromPromise, setup } from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../../types/base"
import { giftMakerHistoryStore } from "../stores/giftMakerHistory"
import type {
  StorageOperationErr,
  StorageOperationResult,
} from "../stores/storageOperations"
import type { GiftInfo } from "./shared/getGiftInfo"
import {
  type GiftClaimActorOutput,
  giftClaimActor,
} from "./shared/giftClaimActor"

export type GiftMakerReadyActorInput = {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
  parsed: {
    token: BaseTokenInfo | UnifiedTokenInfo
    amount: TokenValue
    message: string
  }
  iv: null | string
}

export type GiftMakerReadyActorOutput =
  | {
      tag: "ok"
    }
  | {
      tag: "err"
      value: {
        reason: GiftMakerReadyActorErrors
      }
    }

export type GiftMakerReadyActorErrors = {
  reason: StorageOperationErr | "GIFT_ALREADY_CLAIMED_OR_EXECUTED"
}

interface GiftMakerReadyActorContext extends GiftMakerReadyActorInput {
  error: null | GiftMakerReadyActorErrors
}

export const giftMakerReadyActor = setup({
  types: {
    input: {} as GiftMakerReadyActorInput,
    context: {} as GiftMakerReadyActorContext,
    output: {} as GiftMakerReadyActorOutput,
    events: {} as { type: "FINISH" | "CANCEL_GIFT" },
    children: {} as {
      giftMakerClaimRef: "claimGiftActor"
    },
  },
  actors: {
    claimGiftActor: giftClaimActor as unknown as PromiseActorLogic<
      GiftClaimActorOutput,
      void
    >,
    removeGiftFromHistory: fromPromise(
      async ({
        input,
      }: {
        input: GiftMakerReadyActorContext
      }): Promise<StorageOperationResult> => {
        const result = await giftMakerHistoryStore
          .getState()
          .removeGift(input.giftInfo.secretKey, input.signerCredentials)

        if (result.tag === "err") {
          return { tag: "err", reason: result.reason }
        }
        return { tag: "ok" }
      }
    ),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      logger.error(event.error)
    },
    setError: assign({
      error: (
        _,
        result:
          | {
              tag: "err"
              value: GiftMakerReadyActorErrors
            }
          | { tag: "ok" }
      ) => {
        assert(result.tag === "err")
        return result.value
      },
    }),
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
    isTrue: (_, value: boolean) => value,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAOlwgBswBiMAJzoHs6SAHC9AFwDNnUSoubpwCy6ANb0ACgFcARhVyw8+KACUw3ANoAGALqJQrRrFydcjfIZAAPRAFoATADYAHCQDMAdlc6AjDoALDpufgCszgA0IACeDn4e7oGBvuGOOl6BAc4AvjnRaFgqxGSUNABiAJIAcpUAygASugZIIMam5pbWdgj2fv2OJH6O-X6BiV790XEIw14kKemuY2Guro4AnF4eeQUYOAQl5FTUAMIAgtWnAKIAMgD6APJqACLXas3W7WYWVq099jCkxIzi8W0CYSCGw2rg2HmmiDmC3WOmWELWm0muxAhQOhFImHQ+EwYAoilUAHEhJxqBBLGAyPgAG6MSQCaliSR0U5Eklkri-DTafRfEw-Lr-BzOIEgyYbML9DweTZ+BEIYIbEhhRyQlbJXzLbG44oE3mk8lQKnCWn0xkstmCYSc+g84nmgWWIVaPwtIxizp-UAAkaBEiwyGOHxeaPORwuNUarU6-wQ-WovxG-YmkiEt1kgiW6m0BjMNgcHh8dlOiQus38gNekWtb4B7rxfx+TwbHT+DZ+DaOZJheGxRBx9xbbzOfw6DxjMZePL5ED4RgQODWY2HIiijq-Nu9frToYjfrjVyTVWj3pxsIkDYpHSD1brZzJTNFbelKi78WB2xSpkWoZBeoIKgkmxqvYHiaiE6zDIOmRrLCH54iUuZ8haVqcL+raSr0bg6GGMF9r48obNOGxqoORGBC43b9nCgRvgOqHZtwBBKNgkC4fu+GAjKcbOM4-Z+NsSyOGqCqDM4HjDoOwRhIEcJhEuORAA */
  context: ({ input }) => ({
    ...input,
    error: null,
  }),

  initial: "idle",

  output: ({ event }) => {
    return event.output as GiftMakerReadyActorOutput
  },

  states: {
    idle: {
      on: {
        FINISH: "finished",
        CANCEL_GIFT: "cancelling",
      },
    },
    cancelling: {
      initial: "claiming",
      states: {
        claiming: {
          invoke: {
            id: "giftMakerClaimRef",
            src: "claimGiftActor",
            input: ({ context }) => {
              return {
                giftInfo: context.giftInfo,
                signerCredentials: context.signerCredentials,
              }
            },
            onDone: [
              {
                target: "removing",
                guard: {
                  type: "isTrue",
                  params: ({ event }) =>
                    event.output.giftStatus === "claimed" ||
                    event.output.giftStatus === "already_claimed_or_executed",
                },
              },
              {
                target: "#(machine).idle",
                actions: [
                  {
                    type: "logError",
                    params: {
                      error: { reason: "GIFT_ALREADY_CLAIMED_OR_EXECUTED" },
                    },
                  },
                  {
                    type: "setError",
                    params: {
                      tag: "err",
                      value: { reason: "GIFT_ALREADY_CLAIMED_OR_EXECUTED" },
                    },
                  },
                ],
              },
            ],
            onError: {
              target: "#(machine).idle",
              actions: [{ type: "logError", params: ({ event }) => event }],
            },
          },
        },
        removing: {
          invoke: {
            src: "removeGiftFromHistory",
            input: ({ context }) => context,
            onDone: [
              {
                guard: { type: "isOk", params: ({ event }) => event.output },
                target: "#(machine).finished",
              },
              {
                target: "#(machine).failed",
                actions: [
                  {
                    type: "logError",
                    params: ({ event }) => {
                      if (event.output.tag === "err") {
                        return { error: { reason: event.output.reason } }
                      }
                      return {
                        error: { reason: "ERR_STORAGE_OPERATION_EXCEPTION" },
                      }
                    },
                  },
                  {
                    type: "setError",
                    params: ({ event }) => {
                      assert(event.output.tag === "err")
                      return {
                        tag: "err",
                        value: { reason: event.output.reason },
                      }
                    },
                  },
                ],
              },
            ],
            onError: {
              target: "#(machine).idle",
              actions: [{ type: "logError", params: ({ event }) => event }],
            },
          },
        },
      },
    },

    finished: {
      type: "final",
      output: { tag: "ok" },
      actions: "sendToDepositedBalanceRefRefresh",
    },

    failed: {
      type: "final",
      output: ({ context }) => {
        return {
          tag: "err",
          value: { reason: context.error },
        }
      },
      actions: "sendToDepositedBalanceRefRefresh",
    },
  },
})
