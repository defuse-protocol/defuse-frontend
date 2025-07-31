import { createStore } from "@xstate/store"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"

export type OTCMarkerFormValuesState = {
  amountIn: string
  amountOut: string
  tokenIn: null | BaseTokenInfo | UnifiedTokenInfo
  tokenOut: null | BaseTokenInfo | UnifiedTokenInfo
  expiry: string
}

export const createOTCMakerFormValuesStore = ({
  initialTokenIn,
  initialTokenOut,
}: {
  initialTokenIn: BaseTokenInfo | UnifiedTokenInfo
  initialTokenOut: BaseTokenInfo | UnifiedTokenInfo
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
      updateTokenIn: (
        context,
        event: { value: BaseTokenInfo | UnifiedTokenInfo },
        enqueue
      ) => {
        const newContext = {
          ...context,
          tokenIn: event.value,
        }
        enqueue.emit.changed({ context: newContext })
        return newContext
      },
      updateTokenOut: (
        context,
        event: { value: BaseTokenInfo | UnifiedTokenInfo },
        enqueue
      ) => {
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
