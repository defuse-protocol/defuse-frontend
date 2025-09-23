import { createStore } from "@xstate/store"
import type { TokenInfo } from "../../../types/base"

export type OTCMarkerFormValuesState = {
  amountIn: string
  amountOut: string
  tokenIn: null | TokenInfo
  tokenOut: null | TokenInfo
  expiry: string
}

export const createOTCMakerFormValuesStore = ({
  initialTokenIn,
  initialTokenOut,
}: {
  initialTokenIn: TokenInfo
  initialTokenOut: TokenInfo
}) =>
  createStore({
    context: {
      amountIn: "",
      amountOut: "",
      tokenIn: initialTokenIn,
      tokenOut: initialTokenOut,
      expiry: "1d",
    } satisfies OTCMarkerFormValuesState,
    emits: {
      changed: (_: { context: OTCMarkerFormValuesState }) => {},
    },
    on: {
      updateAmountIn: (context, event: { value: string }, enqueue) => {
        const newContext = {
          ...context,
          amountIn: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateAmountOut: (context, event: { value: string }, enqueue) => {
        const newContext = {
          ...context,
          amountOut: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateTokenIn: (context, event: { value: TokenInfo }, enqueue) => {
        const newContext = {
          ...context,
          tokenIn: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateTokenOut: (context, event: { value: TokenInfo }, enqueue) => {
        const newContext = {
          ...context,
          tokenOut: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      switchTokens: (context, _, enqueue) => {
        const newContext = {
          ...context,
          tokenIn: context.tokenOut,
          tokenOut: context.tokenIn,
          amountIn: context.amountOut,
          amountOut: context.amountIn,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateExpiry: (context, event: { value: string }, enqueue) => {
        const newContext = {
          ...context,
          expiry: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
    },
  })
