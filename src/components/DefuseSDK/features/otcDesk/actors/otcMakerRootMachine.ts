import type { MultiPayload } from "@defuse-protocol/contract-types"
import { errors } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import {
  type ActorRefFrom,
  type PromiseActorLogic,
  assertEvent,
  assign,
  sendTo,
  setup,
} from "xstate"
import type { SignerCredentials } from "../../../core/formatters"
import { logger } from "../../../logger"
import { emitEvent } from "../../../services/emitter"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import {
  type Events as DepositedBalanceEvents,
  depositedBalanceMachine,
} from "../../machines/depositedBalanceMachine"
import { otcMakerTradesStore } from "../stores/otcMakerTrades"
import type { CreateOtcTrade } from "../types/sharedTypes"
import { otcMakerConfigLoadActor } from "./otcMakerConfigLoadActor"
import { otcMakerFormMachine } from "./otcMakerFormMachine"
import {
  type OTCMakerReadyOrderActorInput,
  otcMakerReadyOrderActor,
} from "./otcMakerReadyOrderActor"
import {
  type OTCMakerSignActorErrors,
  type OTCMakerSignActorInput,
  type OTCMakerSignActorOutput,
  otcMakerSignMachine,
} from "./otcMakerSignActor"
import {
  type OtcMakerStoreActorErrors,
  type OtcMakerStoreActorInput,
  type OtcMakerStoreActorOutput,
  otcMakerStoreActor,
} from "./otcMakerStoreActor"

type CompleteSignEvent = {
  type: "COMPLETE_SIGN"
  multiPayload: MultiPayload
  signerCredentials: SignerCredentials
  usedNonceBase64: string
}

type CompleteStoringEvent = {
  type: "COMPLETE_STORING"
  multiPayload: MultiPayload
  signerCredentials: SignerCredentials
  usedNonceBase64: string
  tradeId: string
  pKey: string
  iv: string
}

type InputType = {
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
  initialTokenIn: BaseTokenInfo | UnifiedTokenInfo
  initialTokenOut: BaseTokenInfo | UnifiedTokenInfo
  referral: string | undefined
  createOtcTrade: CreateOtcTrade
}

type EventType =
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
  | CompleteSignEvent
  | CompleteStoringEvent
  | {
      type: "xstate.done.actor.storeRef"
      output: {
        tag: "ok"
        value: CompleteStoringEvent
      }
    }

type ContextType = {
  error: null | OTCMakerSignActorErrors | OtcMakerStoreActorErrors
  formRef: ActorRefFrom<typeof otcMakerFormMachine>
  depositedBalanceRef: ActorRefFrom<typeof depositedBalanceMachine>
  otcMakerConfigLoadRef: ActorRefFrom<typeof otcMakerConfigLoadActor>
  referral: string | undefined
  createOtcTrade: CreateOtcTrade
}

type ChildrenType = {
  readyOrderRef: "readyOrderActor"
  otcMakerConfigLoadRef: "otcMakerConfigLoadActor"
}

export const otcMakerRootMachine = setup({
  types: {
    input: {} as InputType,
    events: {} as EventType,
    context: {} as ContextType,
    children: {} as ChildrenType,
  },
  actors: {
    formActor: otcMakerFormMachine,
    depositedBalanceActor: depositedBalanceMachine,
    signActor: otcMakerSignMachine as unknown as PromiseActorLogic<
      OTCMakerSignActorOutput,
      OTCMakerSignActorInput
    >,
    readyOrderActor: otcMakerReadyOrderActor as unknown as PromiseActorLogic<
      void,
      OTCMakerReadyOrderActorInput
    >,
    otcMakerConfigLoadActor: otcMakerConfigLoadActor,
    storeActor: otcMakerStoreActor as unknown as PromiseActorLogic<
      OtcMakerStoreActorOutput,
      OtcMakerStoreActorInput
    >,
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
              value: OTCMakerSignActorErrors | OtcMakerStoreActorErrors
            }
          | { tag: "ok" }
      ) => {
        assert(result.tag === "err")
        return result.value
      },
    }),
    clearError: assign({ error: null }),
    relayToDepositedBalanceRef: sendTo(
      "depositedBalanceRef",
      (_, event: DepositedBalanceEvents) => event
    ),
    completeSign: (
      { self },
      event: {
        multiPayload: MultiPayload
        signerCredentials: SignerCredentials
        usedNonceBase64: string
      }
    ) => {
      self.send({ type: "COMPLETE_SIGN", ...event })
    },
    completeStoring: (
      { self },
      event: {
        multiPayload: MultiPayload
        signerCredentials: SignerCredentials
        usedNonceBase64: string
        tradeId: string
        pKey: string
        iv: string
      }
    ) => {
      self.send({
        type: "COMPLETE_STORING",
        multiPayload: event.multiPayload,
        signerCredentials: event.signerCredentials,
        usedNonceBase64: event.usedNonceBase64,
        tradeId: event.tradeId,
        pKey: event.pKey,
        iv: event.iv,
      })
    },
    emitOtcDealInitiated: ({ context, event }) => {
      assertEvent(event, "COMPLETE_STORING")

      const form = context.formRef.getSnapshot()
      const parsedValuesSnapshot = form.context.parsedValues.getSnapshot()

      const { tokenOut, tokenIn, amountIn, amountOut, expiry } =
        parsedValuesSnapshot.context

      assert(tokenOut != null)
      assert(tokenIn != null)

      emitEvent("otc_deal_initiated", {
        intent_id: event.tradeId,
        token_from: tokenOut.symbol,
        token_to: tokenIn.symbol,
        amount_from: amountOut,
        amount_to: amountIn,
        order_expiry_time: expiry,
        otc_creator: event.signerCredentials,
      })
    },
  },
  guards: {
    isOk: (_, params: { tag: "ok" | "err" }) => params.tag === "ok",
    isFormValid: ({ context }) => {
      return context.formRef.getSnapshot().context.isValid
    },
  },
}).createMachine({
  context: ({ input, spawn }) => ({
    error: null,
    formRef: spawn("formActor", {
      input: {
        initialTokenIn: input.initialTokenIn,
        initialTokenOut: input.initialTokenOut,
      },
    }),
    depositedBalanceRef: spawn("depositedBalanceActor", {
      id: "depositedBalanceRef",
      input: {
        // parentRef: self,
        tokenList: input.tokenList,
      },
    }),
    otcMakerConfigLoadRef: spawn("otcMakerConfigLoadActor", {
      id: "otcMakerConfigLoadRef",
    }),
    referral: input.referral,
    createOtcTrade: input.createOtcTrade,
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
      on: {
        REQUEST_SIGN: {
          target: "signing",
          guard: "isFormValid",
        },
      },
    },
    signing: {
      entry: "clearError",

      on: {
        COMPLETE_SIGN: "storing",
      },

      invoke: {
        id: "signRef",
        src: "signActor",

        input: ({ context, event }) => {
          assertEvent(event, "REQUEST_SIGN")

          const form = context.formRef.getSnapshot()
          const parsed = form.context.parsedValues.getSnapshot()

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
              params: { tag: "err", value: { reason: "EXCEPTION" } },
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
    storing: {
      on: {
        COMPLETE_STORING: "signed",
      },

      invoke: {
        id: "storeRef",
        src: "storeActor",
        input: ({ context, event }) => {
          assertEvent(event, "COMPLETE_SIGN")
          return {
            createOtcTrade: context.createOtcTrade,
            ...event,
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
              params: { tag: "err", value: { reason: "EXCEPTION" } },
            },
          ],
        },

        onDone: [
          {
            guard: { type: "isOk", params: ({ event }) => event.output },
            actions: [
              {
                type: "completeStoring",
                params: ({ event }) => {
                  assert(event.output.tag === "ok")
                  const storeEvent = event.output.value
                  otcMakerTradesStore.getState().addTrade(
                    {
                      tradeId: storeEvent.tradeId,
                      makerMultiPayload: storeEvent.multiPayload,
                      pKey: storeEvent.pKey,
                      iv: storeEvent.iv,
                    },
                    storeEvent.signerCredentials
                  )
                  return event.output.value
                },
              },
            ],
          },
          {
            target: "editing",
            actions: [
              {
                type: "setError",
                params: ({ event }) => event.output,
              },
            ],
          },
        ],
      },
    },
    signed: {
      invoke: {
        id: "readyOrderRef",
        src: "readyOrderActor",

        input: ({ context, event }) => {
          assertEvent(event, "COMPLETE_STORING")

          const form = context.formRef.getSnapshot()
          const formValuesSnapshot = form.context.formValues.getSnapshot()
          const parsedValuesSnapshot = form.context.parsedValues.getSnapshot()

          const formValues = formValuesSnapshot.context as {
            [K in keyof typeof formValuesSnapshot.context]: NonNullable<
              (typeof formValuesSnapshot.context)[K]
            >
          }

          const parsedValues = parsedValuesSnapshot.context as {
            [K in keyof typeof parsedValuesSnapshot.context]: NonNullable<
              (typeof parsedValuesSnapshot.context)[K]
            >
          }

          return {
            parsed: parsedValues,
            raw: formValues,
            usedNonceBase64: event.usedNonceBase64,
            multiPayload: event.multiPayload,
            tradeId: event.tradeId,
            signerCredentials: event.signerCredentials,
            pKey: event.pKey,
            iv: event.iv,
          }
        },

        onDone: {
          target: "editing",
        },

        onError: {
          target: "editing",
          actions: {
            type: "logError",
            params: ({ event }) => event,
          },
        },
      },
      entry: ["emitOtcDealInitiated"],
    },
  },
})
