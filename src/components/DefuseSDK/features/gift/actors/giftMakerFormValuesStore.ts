import { createStore } from "@xstate/store"
import type { TokenInfo } from "../../../types/base"

export type GiftMakerFormValuesState = {
  amount: string
  token: null | TokenInfo
  message: string
}

export const createGiftMakerFormValuesStore = ({
  initialToken,
}: {
  initialToken: TokenInfo
}) =>
  createStore({
    context: {
      amount: "",
      token: initialToken,
      message: "",
    } satisfies GiftMakerFormValuesState,
    emits: {
      changed: (_: { context: GiftMakerFormValuesState }) => {},
    },
    on: {
      updateAmount: (context, event: { value: string }, enqueue) => {
        const newContext = {
          ...context,
          amount: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateToken: (context, event: { value: TokenInfo }, enqueue) => {
        const newContext = {
          ...context,
          token: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateMessage: (context, event: { value: string }, enqueue) => {
        const newContext = {
          ...context,
          message: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      reset: (context, _event, enqueue) => {
        const newContext = {
          ...context,
          amount: "",
          message: "",
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
    },
  })
