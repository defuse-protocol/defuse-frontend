import { type SnapshotFromStore, createStore } from "@xstate/store"
import type { BaseTokenInfo, TokenInfo, TokenValue } from "../../../types/base"
import { parseUnits } from "../../../utils/parse"
import {
  getAnyBaseTokenInfo,
  getTokenMaxDecimals,
} from "../../../utils/tokenUtils"
import type { SwapFormValuesState } from "./swapFormValuesStore"

type State = {
  tokenIn: null | BaseTokenInfo
  tokenOut: null | BaseTokenInfo
  amountIn: null | TokenValue
  amountOut: null | TokenValue
}

export const createSwapFormParsedValuesStore = () =>
  createStore({
    context: {
      amountIn: null,
      amountOut: null,
      tokenIn: null,
      tokenOut: null,
    } as State,
    emits: {
      valuesParsed: (_: { context: State }) => {},
    },
    on: {
      parseValues: (
        context,
        { formValues }: { formValues: SwapFormValuesState },
        enqueue
      ) => {
        const tokenIn =
          formValues.tokenIn != null
            ? getAnyBaseTokenInfo(formValues.tokenIn)
            : null
        const tokenOut =
          formValues.tokenOut != null
            ? getAnyBaseTokenInfo(formValues.tokenOut)
            : null

        const newContext = {
          ...context,
          amountIn: parseTokenValue(tokenIn, formValues.amountIn),
          amountOut: parseTokenValue(tokenOut, formValues.amountOut),
          tokenIn,
          tokenOut,
        }
        enqueue.emit.valuesParsed({ context: newContext })
        return newContext
      },
    },
  })

function parseTokenValue(
  token: null | TokenInfo,
  value: string
): TokenValue | null {
  if (token == null) return null
  const decimals = getTokenMaxDecimals(token)
  try {
    return {
      amount: parseUnits(value, decimals),
      decimals,
    }
  } catch {
    return null
  }
}

export function allSetSelector(
  s: SnapshotFromStore<ReturnType<typeof createSwapFormParsedValuesStore>>
) {
  return (
    s.context.tokenIn != null &&
    s.context.tokenOut != null &&
    s.context.amountIn != null &&
    s.context.amountOut != null
  )
}
