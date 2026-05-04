import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { logger } from "@src/utils/logger"
import type { SnapshotFrom } from "xstate"
import type { TokenValue } from "../../../../types/base"
import { adjustDecimals, netDownAmount } from "../../../../utils/tokenUtils"
import {
  type BalanceMapping,
  balancesSelector,
} from "../../../machines/depositedBalanceMachine"
import type {
  AmountMode,
  withdrawUIMachine,
} from "../../../machines/withdrawUIMachine"

export function isLiquidityUnavailableSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  const reason =
    state.context.quoteResult?.tag === "err"
      ? state.context.quoteResult.value.reason.toUpperCase()
      : null

  return reason?.includes("NO_QUOTES") === true
}

export function isUnsufficientTokenInAmount(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  const reason =
    state.context.quoteResult?.tag === "err"
      ? state.context.quoteResult.value.reason.toUpperCase()
      : null

  if (reason == null) return false
  if (reason.includes("INSUFFICIENT_BALANCE")) return false

  return (
    reason.includes("INSUFFICIENT_AMOUNT") ||
    reason.includes("MIN_AMOUNT") ||
    reason.includes("MINIMUM") ||
    reason.includes("TOO LOW") ||
    reason.includes("AT LEAST")
  )
}

export function isInsufficientBalanceSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): boolean {
  const reason =
    state.context.quoteResult?.tag === "err"
      ? state.context.quoteResult.value.reason.toUpperCase()
      : null

  return reason?.includes("INSUFFICIENT_BALANCE") === true
}

/**
 * @return null | TokenValue - null if not enough info to determine
 */
export function totalAmountReceivedSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  if (
    state.context.quoteResult == null ||
    state.context.quoteResult.tag !== "ok"
  ) {
    return null
  }

  const formContext = state.context.withdrawFormRef.getSnapshot().context

  try {
    return {
      amount: BigInt(state.context.quoteResult.value.quote.amountOut),
      decimals: formContext.tokenOut.decimals,
    }
  } catch (e) {
    logger.error("Failed to parse amountOut as BigInt", {
      amountOut: state.context.quoteResult.value.quote.amountOut,
      error: e,
    })
    return null
  }
}

/**
 * @return amount 0, decimals 0 | TokenValue if not enough info to determine
 */
export function withdrawalFeeSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue {
  if (
    state.context.quoteResult == null ||
    state.context.quoteResult.tag !== "ok"
  ) {
    return { amount: 0n, decimals: 0 }
  }

  const formContext = state.context.withdrawFormRef.getSnapshot().context

  try {
    const amountIn = BigInt(state.context.quoteResult.value.quote.amountIn)
    const amountOut = BigInt(state.context.quoteResult.value.quote.amountOut)

    const tokenInDecimals =
      state.context.quoteInput?.tokenIn.decimals ??
      formContext.tokenOut.decimals
    const tokenOutDecimals = formContext.tokenOut.decimals
    const normalizedAmountOut = adjustDecimals(
      amountOut,
      tokenOutDecimals,
      tokenInDecimals
    )
    const fee =
      amountIn > normalizedAmountOut ? amountIn - normalizedAmountOut : 0n

    return { amount: fee, decimals: tokenInDecimals }
  } catch (e) {
    logger.error("Failed to parse quote amounts as BigInt", {
      amountIn: state.context.quoteResult.value.quote.amountIn,
      amountOut: state.context.quoteResult.value.quote.amountOut,
      error: e,
    })
    return { amount: 0n, decimals: 0 }
  }
}

export function slippageBasisPointsSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): number {
  return state.context.slippageBasisPoints
}

/**
 * In EXACT_OUTPUT mode, returns the estimated total the user will send
 * (amountIn from the quote). Returns null in EXACT_INPUT mode or when no quote
 * is available.
 */
export function estimatedSendAmountSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  if (state.context.amountMode !== QuoteRequest.swapType.EXACT_OUTPUT) {
    return null
  }
  if (
    state.context.quoteResult == null ||
    state.context.quoteResult.tag !== "ok"
  ) {
    return null
  }

  const tokenInDecimals =
    state.context.quoteInput?.tokenIn.decimals ??
    state.context.withdrawFormRef.getSnapshot().context.tokenOut.decimals

  try {
    return {
      amount: BigInt(state.context.quoteResult.value.quote.amountIn),
      decimals: tokenInDecimals,
    }
  } catch (e) {
    logger.error("Failed to parse amountIn as BigInt", {
      amountIn: state.context.quoteResult.value.quote.amountIn,
      error: e,
    })
    return null
  }
}

export function amountModeSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): AmountMode {
  return state.context.amountMode
}

export function minAmountReceivedSelector(
  state: SnapshotFrom<typeof withdrawUIMachine>
): TokenValue | null {
  const totalReceived = totalAmountReceivedSelector(state)
  if (totalReceived == null) return null

  const slippage = state.context.slippageBasisPoints
  if (slippage === 0) return null

  try {
    return {
      amount: netDownAmount(totalReceived.amount, slippage),
      decimals: totalReceived.decimals,
    }
  } catch {
    return null
  }
}

function balancesSelector_(
  state: SnapshotFrom<typeof withdrawUIMachine>
): BalanceMapping {
  return balancesSelector(state.context.depositedBalanceRef?.getSnapshot())
}

export { balancesSelector_ as balancesSelector }
