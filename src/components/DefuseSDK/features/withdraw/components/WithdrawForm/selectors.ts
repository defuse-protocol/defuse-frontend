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
    state.context.preparationOutput?.tag === "err" &&
    state.context.preparationOutput.value.reason === "ERR_NO_QUOTES"
  )
}
export function isUnsufficientTokenInAmount(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  return (
    state.context.preparationOutput?.tag === "err" &&
    state.context.preparationOutput.value.reason === "ERR_INSUFFICIENT_AMOUNT"
  )
}

/**
 * @return null | TokenValue - null if not enough info to determine
 */
export function totalAmountReceivedSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  if (
    state.context.preparationOutput == null ||
    state.context.preparationOutput.tag !== "ok"
  ) {
    return null
  }

  return state.context.preparationOutput.value.receivedAmount
}

/**
 * @return amount 0, decimals 0 | TokenValue if not enough info to determine
 */
export function withdtrawalFeeSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue {
  if (
    state.context.preparationOutput == null ||
    state.context.preparationOutput.tag !== "ok"
  ) {
    return {
      amount: 0n,
      decimals: 0,
    }
  }

  return {
    amount: state.context.preparationOutput.value.feeEstimation.amount,
    decimals: state.context.preparationOutput.value.receivedAmount.decimals,
  }
}

/**
 * @return null | TokenValue - Direction fee on withdrawals (configurable via WITHDRAW_DIRECTION_FEE_BPS)
 */
export function directionFeeSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  if (
    state.context.preparationOutput == null ||
    state.context.preparationOutput.tag !== "ok"
  ) {
    return null
  }

  const { directionFeeAmount, receivedAmount } =
    state.context.preparationOutput.value

  if (directionFeeAmount == null || directionFeeAmount <= 0n) {
    return null
  }

  return {
    amount: directionFeeAmount,
    decimals: receivedAmount.decimals,
  }
}

function balancesSelector_(
  state: SnapshotFrom<typeof withdrawUIMachine>
): BalanceMapping {
  return balancesSelector(state.context.depositedBalanceRef?.getSnapshot())
}

export { balancesSelector_ as balancesSelector }
