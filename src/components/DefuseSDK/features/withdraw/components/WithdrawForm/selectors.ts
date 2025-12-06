import type { SnapshotFrom } from "xstate"
import type { TokenValue } from "../../../../types/base"
import {
  type BalanceMapping,
  balancesSelector,
} from "../../../machines/depositedBalanceMachine"
import type { withdrawUIMachine } from "../../../machines/withdrawUIMachine"

export function isLiquidityUnavailableSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  return (
    state.context.quote1cs?.tag === "err" &&
    state.context.quote1cs.value.reason === "ERR_NO_QUOTES_1CS"
  )
}

/**
 * @return null | TokenValue - null if not enough info to determine
 */
export function totalAmountReceivedSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  const { quote1cs } = state.context
  if (quote1cs == null || quote1cs.tag !== "ok") {
    return null
  }

  const formContext = state.context.withdrawFormRef.getSnapshot().context
  const amountOut = quote1cs.value.tokenDeltas[1][1]

  return {
    amount: amountOut,
    decimals: formContext.tokenOut.decimals,
  }
}

/**
 * @return amount 0, decimals 0 | TokenValue if not enough info to determine
 */
export function withdtrawalFeeSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue {
  const { quote1cs } = state.context
  if (quote1cs == null || quote1cs.tag !== "ok") {
    return {
      amount: 0n,
      decimals: 0,
    }
  }

  const formContext = state.context.withdrawFormRef.getSnapshot().context
  const amountIn = -quote1cs.value.tokenDeltas[0][1]
  const amountOut = quote1cs.value.tokenDeltas[1][1]
  const fee = amountIn - amountOut

  return {
    amount: fee > 0n ? fee : 0n,
    decimals: formContext.tokenOut.decimals,
  }
}

export function is1csQuoteLoadingSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  return state.matches({ editing: "waiting_1cs_quote" })
}

export function quote1csErrorSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): string | null {
  return state.context.quote1csError
}

function balancesSelector_(
  state: SnapshotFrom<typeof withdrawUIMachine>
): BalanceMapping {
  return balancesSelector(state.context.depositedBalanceRef?.getSnapshot())
}

export { balancesSelector_ as balancesSelector }
