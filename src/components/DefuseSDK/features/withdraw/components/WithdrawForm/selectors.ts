import type { SnapshotFrom } from "xstate"
import type { TokenValue } from "../../../../types/base"
import {
  type BalanceMapping,
  balancesSelector,
} from "../../../machines/depositedBalanceMachine"
import type { withdrawUIMachine } from "../../../machines/withdrawUIMachine"
import { isNearIntentsNetwork } from "./utils"

export function isLiquidityUnavailableSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  const formContext = state.context.withdrawFormRef.getSnapshot().context
  // Near Intents transfers don't need liquidity (direct transfer)
  if (isNearIntentsNetwork(formContext.blockchain)) {
    return false
  }

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
  const formContext = state.context.withdrawFormRef.getSnapshot().context

  // For Near Intents, received amount equals sent amount (no fees)
  if (isNearIntentsNetwork(formContext.blockchain)) {
    return formContext.parsedAmount
  }

  const { quote1cs } = state.context
  if (quote1cs == null || quote1cs.tag !== "ok") {
    return null
  }

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
  const formContext = state.context.withdrawFormRef.getSnapshot().context

  // Near Intents transfers have no fees
  if (isNearIntentsNetwork(formContext.blockchain)) {
    return {
      amount: 0n,
      decimals: formContext.tokenOut.decimals,
    }
  }

  const { quote1cs } = state.context
  if (quote1cs == null || quote1cs.tag !== "ok") {
    return {
      amount: 0n,
      decimals: 0,
    }
  }

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
  const formContext = state.context.withdrawFormRef.getSnapshot().context
  // Near Intents transfers don't need 1cs quotes
  if (isNearIntentsNetwork(formContext.blockchain)) {
    return false
  }

  return state.matches({ editing: "waiting_1cs_quote" })
}

export function quote1csErrorSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): string | null {
  return state.context.quote1csError
}

export function isUnsufficientTokenInAmount(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  return (
    state.context.quote1cs?.tag === "err" &&
    state.context.quote1cs.value.reason === "ERR_INSUFFICIENT_AMOUNT"
  )
}

function balancesSelector_(
  state: SnapshotFrom<typeof withdrawUIMachine>
): BalanceMapping {
  return balancesSelector(state.context.depositedBalanceRef?.getSnapshot())
}

export function slippageBasisPointsSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): number {
  return state.context.slippageBasisPoints
}

export { balancesSelector_ as balancesSelector }
