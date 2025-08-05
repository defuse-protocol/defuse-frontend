import { assign, fromPromise, setup } from "xstate"
import {
  type Output,
  getNEP141StorageRequired,
} from "../../services/nep141StorageService"
import type { BaseTokenInfo } from "../../types/base"

const storageDepositAmountActor = fromPromise(
  async ({
    input,
  }: {
    input: {
      token: BaseTokenInfo
      userAccountId: string
    }
  }): Promise<Output> => {
    try {
      const result = await getNEP141StorageRequired({
        token: input.token,
        userAccountId: input.userAccountId,
      })
      return result
    } catch {
      return {
        tag: "err",
        value: {
          reason: "ERR_NEP141_STORAGE_CANNOT_FETCH",
        },
      }
    }
  }
)

export interface Context {
  preparationOutput: Output | null
}

export const storageDepositAmountMachine = setup({
  types: {
    context: {} as Context,
    events: {} as {
      type: "REQUEST_STORAGE_DEPOSIT"
      params: {
        token: BaseTokenInfo
        userAccountId: string
      }
    },
  },
  actors: {
    storageDepositAmountActor: storageDepositAmountActor,
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5SwC4HsBOBDGARMADmrAJYoCCAtmgK4B2KAxAEoCiAigKqsDKAKgH1+AeWbkA4qwG5WABWE8AknwDaABgC6iUEVIoSaOtpAAPRAFoALAE4AdAEZLADksBmAOwBWADQgAnogATIFOttaOagBsgZ4AvrG+qJg4YPi6ZFS0DLYAZmAoAMYAFiR0UIwQhmC2pQBuaADW1UnYeITEGdT0KLn5xaVQCHVoBVj6huoak8bp40ZIphaeag5qnpaRTl6+AQiWnoG2G1txCSAtKWkdFF3ZeYUlZYxgGBiYtgQANmM5mJS2Fzas0y3V6DwGQzo9VGc0m0wWswM81AZgQVjsbm2-kQ63ctk80VOZzoaAgcGMgNS7T0IIYM2uSOMqPM9ickTCkTU1g8PmxCHs9nZ7msmy88US6FaVOBtx6JAgnzA9L0jIWzPsrlCIq5PJ2QTUllsgRFJ3F50ll2pnSyPXu-TKyrIqpRFkirls0XsOqxu1cwVsbL9TnsMTNlKuNNltgKaEoX3ykEdcyZQUNaycnm5PsQkQJtlclncucJ8XiQA */
  id: "storageDepositAmount",

  context: () => ({
    preparationOutput: null,
  }),

  initial: "idle",

  states: {
    idle: {},

    fetching: {
      invoke: {
        src: "storageDepositAmountActor",

        input: ({ event }) => ({
          token: event.params.token,
          userAccountId: event.params.userAccountId,
        }),

        onDone: {
          target: "completed",
          actions: assign({
            preparationOutput: ({ event }) => event.output,
          }),
        },
        onError: {
          target: "completed",
          actions: assign({
            preparationOutput: {
              tag: "err",
              value: {
                reason: "ERR_NEP141_STORAGE_CANNOT_FETCH",
              },
            },
          }),
          reenter: true,
        },
      },
    },

    completed: {},
  },

  on: {
    REQUEST_STORAGE_DEPOSIT: ".fetching",
  },
})
