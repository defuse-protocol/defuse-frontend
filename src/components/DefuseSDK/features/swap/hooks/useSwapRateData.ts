import type { SnapshotFrom } from "xstate"
import {
  accountSlippageExactIn,
  computeTotalDeltaDifferentDecimals,
} from "../../../utils/tokenUtils"
import type { swapUIMachine } from "../../machines/swapUIMachine"
import { SwapUIMachineContext } from "../components/SwapUIMachineProvider"

export function useSwapRateData() {
  return SwapUIMachineContext.useSelector(swapRateDataSelector)
}

function swapRateDataSelector(state: SnapshotFrom<typeof swapUIMachine>) {
  const slippageBasisPoints = state.context.slippageBasisPoints

  if (state.context.quote == null || state.context.quote.tag === "err") {
    return {
      amountOut: null,
      minAmountOut: null,
      slippageBasisPoints,
      exchangeRate: null,
      inverseExchangeRate: null,
    }
  }

  const quote = state.context.quote.value
  const form = state.context.formRef.getSnapshot()
  const parsed = form.context.parsedValues.getSnapshot().context

  const amountOut = computeTotalDeltaDifferentDecimals(
    [parsed.tokenOut],
    quote.tokenDeltas
  )

  const minAmountOut = computeTotalDeltaDifferentDecimals(
    [parsed.tokenOut],
    accountSlippageExactIn(quote.tokenDeltas, state.context.slippageBasisPoints)
  )

  const amountIn = parsed.amountIn
  const exchangeRate =
    amountIn != null && amountIn.amount !== 0n // hotfix incorrect calculation when amountOut is 0
      ? {
          amount:
            (amountOut.amount * 10n ** BigInt(amountIn.decimals)) /
            amountIn.amount,
          decimals: amountOut.decimals,
        }
      : null

  const inverseExchangeRate =
    amountIn != null && amountOut.amount !== 0n // hotfix prevents division by zero when amountOut is 0
      ? {
          amount:
            (amountIn.amount * 10n ** BigInt(amountOut.decimals)) /
            amountOut.amount,
          decimals: amountIn.decimals,
        }
      : null

  return {
    amountOut,
    minAmountOut,
    slippageBasisPoints,
    exchangeRate,
    inverseExchangeRate,
  }
}
