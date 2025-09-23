import { errors, solverRelay } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import {
  type ActorRefFrom,
  type DoneActorEvent,
  type InputFrom,
  type PromiseActorLogic,
  assertEvent,
  assign,
  fromPromise,
  sendTo,
  setup,
} from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import { emitEvent } from "../../../services/emitter"
import type { TokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import {
  type Events as DepositedBalanceEvents,
  depositedBalanceMachine,
} from "../../machines/depositedBalanceMachine"
import { giftMakerHistoryStore } from "../stores/giftMakerHistory"
import type {
  StorageOperationErr,
  StorageOperationResult,
} from "../stores/storageOperations"
import type {
  CreateGiftIntent,
  GiftSignedResult,
  SavingGiftResult,
} from "../types/sharedTypes"
import {
  type EscrowCredentials,
  generateEscrowCredentials,
} from "../utils/generateEscrowCredentials"
import { assembleGiftInfo, getParsedValues } from "../utils/makerMachine"
import { giftMakerFormMachine } from "./giftMakerFormMachine"
import {
  type GiftMakerPublishingActorErrors,
  type GiftMakerPublishingActorInput,
  type GiftMakerPublishingActorOutput,
  giftMakerPublishingActor,
} from "./giftMakerPublishingActor"
import {
  type GiftMakerReadyActorErrors,
  type GiftMakerReadyActorInput,
  type GiftMakerReadyActorOutput,
  giftMakerReadyActor,
} from "./giftMakerReadyActor"
import type {
  GiftMakerSignActorErrors,
  GiftMakerSignActorInput,
  GiftMakerSignActorOutput,
} from "./giftMakerSignActor"
import { giftMakerSignActor } from "./giftMakerSignActor"

type GiftMakerRootMachineErrors =
  | GiftMakerSignActorErrors
  | GiftMakerPublishingActorErrors
  | { reason: StorageOperationErr }
  | GiftMakerReadyActorErrors

export type GiftMakerRootMachineContext = {
  error: null | GiftMakerRootMachineErrors
  formRef: ActorRefFrom<typeof giftMakerFormMachine>
  depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  escrowCredentials: null | EscrowCredentials
  referral: string | undefined
  signData: null | GiftSignedResult
  intentHashes: null | string[]
  createGiftIntent: CreateGiftIntent
  iv: null | string
}

export const giftMakerRootMachine = setup({
  types: {
    input: {} as {
      tokenList: TokenInfo[]
      initialToken: TokenInfo
      referral: string | undefined
      createGiftIntent: CreateGiftIntent
    },
    events: {} as
      | DepositedBalanceEvents
      | {
          type: "START_OVER"
        }
      | {
          type: "REQUEST_SIGN"
          signerCredentials: SignerCredentials
          signMessage: (
            params: walletMessage.WalletMessage
          ) => Promise<walletMessage.WalletSignatureResult | null>
        }
      | {
          type: "COMPLETE_SIGN"
          params: GiftSignedResult
        }
      | DoneActorEvent<SavingGiftResult>,
    context: {} as GiftMakerRootMachineContext,
    children: {} as {
      readyGiftRef: "readyGiftActor"
    },
  },
  actors: {
    formActor: giftMakerFormMachine,
    // biome-ignore lint/suspicious/noExplicitAny: bypass xstate+ts bloating; be careful when interacting with `depositedBalanceActor` string
    depositedBalanceActor: depositedBalanceMachine as any,
    signActor: giftMakerSignActor as unknown as PromiseActorLogic<
      GiftMakerSignActorOutput,
      GiftMakerSignActorInput
    >,
    publishingActor: giftMakerPublishingActor as unknown as PromiseActorLogic<
      GiftMakerPublishingActorOutput,
      GiftMakerPublishingActorInput
    >,
    readyGiftActor: giftMakerReadyActor as unknown as PromiseActorLogic<
      GiftMakerReadyActorOutput,
      GiftMakerReadyActorInput
    >,
    settlingActor: fromPromise(
      ({
        input,
        signal,
      }: { input: { intentHashes: string[] }; signal: AbortSignal }) => {
        const intentHash = input.intentHashes[0]
        assert(intentHash, "intentHash is not defined")
        return solverRelay.waitForIntentSettlement({
          signal,
          intentHash,
        })
      }
    ),
    savingGift: fromPromise(
      async ({
        input,
      }: {
        input: GiftMakerRootMachineContext
      }): Promise<SavingGiftResult> => {
        try {
          assert(input.signData, "signData is not defined")
          const giftInfo = assembleGiftInfo(input)

          // Create a record and generate an IV
          const { iv, giftId } = await input.createGiftIntent({
            secretKey: giftInfo.secretKey,
            message: giftInfo.message,
          })

          const result = await giftMakerHistoryStore.getState().addGift(
            {
              ...giftInfo,
              iv,
              createdAt: Date.now(),
            },
            input.signData.signerCredentials
          )

          if (result.tag === "err") {
            return { tag: "err", reason: result.reason }
          }

          emitEvent("gift_created", {
            gift_id: giftId,
            gift_token: giftInfo.token.symbol,
            gift_amount: giftInfo.tokenDiff,
            message_included: giftInfo.message,
            creator_wallet_address: input.signData.signerCredentials,
          })

          return { tag: "ok", value: { iv } }
        } catch {
          return { tag: "err", reason: "ERR_STORAGE_OPERATION_EXCEPTION" }
        }
      }
    ),
    updatingGift: fromPromise(
      async ({
        input,
      }: {
        input: GiftMakerRootMachineContext
      }): Promise<StorageOperationResult> => {
        assert(input.signData, "signData is not defined")
        const giftInfo = assembleGiftInfo(input)
        const result = await giftMakerHistoryStore
          .getState()
          .updateGift(
            giftInfo.secretKey,
            input.signData.signerCredentials,
            giftInfo.intentHashes
          )

        if (result.tag === "err") {
          return { tag: "err", reason: result.reason }
        }
        return { tag: "ok" }
      }
    ),
    removingGift: fromPromise(
      async ({
        input,
      }: {
        input: GiftMakerRootMachineContext
      }): Promise<StorageOperationResult> => {
        assert(input.signData, "signData is not defined")
        const giftInfo = assembleGiftInfo(input)
        const result = await giftMakerHistoryStore
          .getState()
          .removeGift(giftInfo.secretKey, input.signData.signerCredentials)

        if (result.tag === "err") {
          return { tag: "err", reason: result.reason }
        }
        return { tag: "ok" }
      }
    ),
  },
  actions: {
    logError: (_, event: { error: unknown }) => {
      const err = errors.toError(event.error)
      logger.error(err)
    },
    setError: assign({
      error: (
        _,
        result:
          | {
              tag: "err"
              value: GiftMakerRootMachineErrors
            }
          | { tag: "ok" }
      ) => {
        assert(result.tag === "err")
        return result.value
      },
    }),
    relayToDepositedBalanceRef: sendTo(
      "depositedBalanceRef",
      (_, event: DepositedBalanceEvents) => event
    ),
    sendToDepositedBalanceRefRefresh: sendTo("depositedBalanceRef", (_) => ({
      type: "REQUEST_BALANCE_REFRESH",
    })),
    completeSign: ({ self }, event: GiftSignedResult) => {
      self.send({ type: "COMPLETE_SIGN", params: event })
    },
    cleanup: assign({
      error: null,
      signData: null,
      escrowCredentials: null,
    }),
    clearEscrowCredentials: assign({
      escrowCredentials: null,
    }),
    generateEscrowCredentials: assign({
      escrowCredentials: () => generateEscrowCredentials(),
    }),
    setIV: assign({
      iv: (_, event: { output?: SavingGiftResult }) => {
        if (event?.output?.tag === "ok") {
          return event.output.value.iv
        }
        return null
      },
    }),
    clearIV: assign({
      iv: null,
    }),
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
    isFormValid: ({ context }) => {
      return context.formRef.getSnapshot().context.isValid
    },
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QAoC2BDAxgCwJYDswBKAYgBkB5AcQEkA5AbQAYBdRUABwHtZcAXXF3zsQAD0QBaAEwBGAGwA6ACxKmsgJwBmdXIAcezVIA0IAJ6T1AVgUB2dUt1T9mpXaV6Avh5NoseQqSUVBQAqgAqzGxIINy8AkIi4ggyllIKTDqWckxysjI2esZmFtZujs6u9p7eIL44BMQKkPwEUCQASgCiAIohnQDKYQD6-TRUjKwisS0J0UkSMjKaCjqaukoyuvqpKuom5ghSTDIKlpo2KkqaMuq6lse6Xj4Y9QEKvFD4rSQQQmAKBAAblwANb-D74dpgABmkSmPBmwjmiDkiicunUTCUqRcjhk+0QUksNgUuhsUg2MixlhuGSetRe-kaEO+v0IAPwwLB71wnyhsJkUU4CPiSNASU0NIUVPsUk0ciU6gK8qUBMOxNJ5KURwxUisTE09LqTKIPM+3zAACdLVxLQoOAAbdB8aG21BmyEwuHRaaixKSbRMdIaJZnGw07RqwzqaVMJg2bQFC4uSxGxkNU0s-BtADCFAAsgAFMidMKdEZjCZCmIiwRisSSGRHU7rLTy9EGhVq1yKSwOOTqG5SGxMSxaNN+DMeyA-P4crn-S1gdAQUxUXDQvj873CuJ1-0IbQnewydxrAdZPWq4oIMckkdN8MXFI5CevZm8wgQEhWm12x3Oq6lrukuK5rhuW5epMPq1rM4qSKoihUjYZJrOS6hSFIchqsSSi2BSeg5Fc5woV4NT4FwEBwCIxoZvCe5wQ2CASNieHIahZJ6ph2E3i40pymoeRMBi2IUm+JpNBALTZvRiIHhIuhBnYlj6FYtz2OcRQHE2Jy5Joaj9kskpiTUtFvFmUCyX6yLMSkyxYXcVxkohay6FGqinGc+iLEcNx9qmpnpuZn6QFZ+42QsdwKO2w6aHFKlnFkOHkrYxxOE2+nkksZEeEAA */
  context: ({ input, spawn }) => ({
    error: null,
    formRef: spawn("formActor", {
      input: {
        initialToken: input.initialToken,
      },
    }),
    depositedBalanceRef: spawn("depositedBalanceActor", {
      id: "depositedBalanceRef",
      input: {
        tokenList: input.tokenList,
        // `depositedBalanceActor` is any, so we explicitly safeguard it with `satisfies`
      } satisfies InputFrom<typeof depositedBalanceMachine>,
    }),
    escrowCredentials: null,
    referral: input.referral,
    signData: null,
    intentHashes: null,
    createGiftIntent: input.createGiftIntent,
    iv: null,
  }),

  initial: "editing",

  on: {
    LOGIN: {
      actions: {
        type: "relayToDepositedBalanceRef",
        params: ({ event }) => event,
      },
    },
    LOGOUT: {
      actions: {
        type: "relayToDepositedBalanceRef",
        params: ({ event }) => event,
      },
    },
  },
  states: {
    editing: {
      entry: ["clearEscrowCredentials", "clearIV"],

      on: {
        REQUEST_SIGN: {
          guard: "isFormValid",
          target: "signing",
        },
      },
    },
    signing: {
      entry: ["cleanup", "generateEscrowCredentials"],

      on: {
        COMPLETE_SIGN: {
          target: "saving",
        },
      },

      invoke: {
        id: "signRef",
        src: "signActor",

        input: ({ context, event }) => {
          assertEvent(event, "REQUEST_SIGN")

          const form = context.formRef.getSnapshot()
          const parsed = form.context.parsedValues.getSnapshot()

          assert(context.escrowCredentials != null)

          return {
            signerCredentials: event.signerCredentials,
            signMessage: event.signMessage,
            parsed: parsed.context as {
              [K in keyof typeof parsed.context]: NonNullable<
                (typeof parsed.context)[K]
              >
            },
            balances:
              context.depositedBalanceRef.getSnapshot().context.balances,
            referral: context.referral,
            escrowCredentials: context.escrowCredentials,
          }
        },

        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: { tag: "err", value: { reason: "ERR_GIFT_SIGNING" } },
            },
          ],
        },

        onDone: [
          {
            guard: { type: "isOk", params: ({ event }) => event.output },
            actions: {
              type: "completeSign",
              params: ({ event }) => {
                assert(event.output.tag === "ok")
                return event.output.value
              },
            },
          },
          {
            target: "editing",
            actions: {
              type: "setError",
              params: ({ event }) => event.output,
            },
          },
        ],
      },
    },
    saving: {
      entry: [
        assign({
          signData: ({ event }) => {
            assertEvent(event, "COMPLETE_SIGN")
            return event.params
          },
        }),
      ],
      invoke: {
        src: "savingGift",
        input: ({ context }) => context,
        onDone: [
          {
            guard: { type: "isOk", params: ({ event }) => event.output },
            target: "publishing",
            actions: {
              type: "setIV",
              params: ({ event }) => event,
            },
          },
          {
            target: "editing",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return { tag: "err", value: { reason: event.output.reason } }
              },
            },
          },
        ],
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: {
                tag: "err",
                value: { reason: "ERR_STORAGE_OPERATION_EXCEPTION" },
              },
            },
          ],
        },
      },
    },
    publishing: {
      invoke: {
        src: "publishingActor",
        input: ({ context }) => {
          const multiPayload = context.signData?.multiPayload
          assert(multiPayload, "multiPayload is not defined")
          return {
            multiPayload,
          }
        },
        onDone: [
          {
            guard: ({ event }) => {
              return event.output.giftStatus === "published"
            },
            target: "settling",
            actions: assign({
              intentHashes: ({ event }) => {
                assert(event.output.giftStatus === "published")
                return event.output.intentHashes
              },
            }),
          },
          {
            target: "removing",
            actions: [
              {
                type: "setError",
                params: {
                  tag: "err",
                  value: { reason: "ERR_GIFT_PUBLISHING" },
                },
              },
            ],
          },
        ],
        onError: {
          target: "removing",
          actions: [
            {
              type: "logError",
              params: { error: "EXCEPTION" },
            },
          ],
        },
      },
    },
    settling: {
      invoke: {
        src: "settlingActor",
        input: ({ context }) => {
          assert(context.intentHashes, "intentHashes is not defined")
          return {
            intentHashes: context.intentHashes,
          }
        },

        onDone: {
          target: "updating",
        },
        onError: {
          target: "editing",
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },
    },
    updating: {
      invoke: {
        src: "updatingGift",
        input: ({ context }) => context,
        onDone: [
          {
            guard: { type: "isOk", params: ({ event }) => event.output },
            target: "settled",
          },
          {
            target: "editing",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return { tag: "err", value: { reason: event.output.reason } }
              },
            },
          },
        ],
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: {
                tag: "err",
                value: { reason: "ERR_STORAGE_OPERATION_EXCEPTION" },
              },
            },
          ],
        },
      },
    },
    settled: {
      invoke: {
        id: "readyGiftRef",
        src: "readyGiftActor",
        input: ({ context }) => {
          const giftInfo = assembleGiftInfo(context)
          const parsedValues = getParsedValues(context)
          assert(context.signData, "signData is not defined")
          assert(parsedValues.token, "token is not defined")
          assert(parsedValues.amount, "amount is not defined")

          assert(context.escrowCredentials != null)

          return {
            giftInfo,
            signerCredentials: context.signData.signerCredentials,
            parsed: {
              token: parsedValues.token,
              amount: parsedValues.amount,
              message: parsedValues.message,
            },
            iv: context.iv,
          }
        },

        onDone: [
          {
            target: "editing",
            actions: "sendToDepositedBalanceRefRefresh",
            guard: { type: "isOk", params: ({ event }) => event.output },
          },
          {
            target: "editing",
            actions: [
              "sendToDepositedBalanceRefRefresh",
              {
                type: "setError",
                params: ({ event }) => {
                  assert(event.output.tag === "err")
                  return {
                    tag: "err",
                    value: event.output.value.reason,
                  }
                },
              },
            ],
          },
        ],

        onError: {
          target: "editing",
          actions: {
            type: "logError",
            params: ({ event }) => {
              return event
            },
          },
        },
      },
    },
    removing: {
      invoke: {
        src: "removingGift",
        input: ({ context }) => context,
        onDone: [
          {
            guard: { type: "isOk", params: ({ event }) => event.output },
            target: "editing",
          },
          {
            target: "editing",
            actions: {
              type: "setError",
              params: ({ event }) => {
                assert(event.output.tag === "err")
                return { tag: "err", value: { reason: event.output.reason } }
              },
            },
          },
        ],
        onError: {
          target: "editing",
          actions: [
            {
              type: "logError",
              params: ({ event }) => event,
            },
            {
              type: "setError",
              params: {
                tag: "err",
                value: { reason: "ERR_STORAGE_OPERATION_EXCEPTION" },
              },
            },
          ],
        },
      },
    },
  },
})
