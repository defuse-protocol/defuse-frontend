import type { TokenValue } from "../../../types/base"
import { netDownAmount } from "../../../utils/tokenUtils"

export type AmountModeFallbackNotice = "execution_balance_limit"

/**
 * Heuristic pre-quote check: is the requested amount too close to the
 * available balance to leave room for slippage?
 */
export function isNearFullBalance(
  requestedAmount: TokenValue,
  availableBalance: TokenValue | undefined,
  slippageBasisPoints: number
): boolean {
  if (availableBalance == null) return false
  return (
    requestedAmount.amount >
    netDownAmount(availableBalance.amount, slippageBasisPoints)
  )
}

/**
 * Authoritative check: does the quoted amountIn exceed the user's balance?
 */
export function exceedsBalance(
  amountIn: bigint,
  availableBalance: TokenValue | undefined
): boolean {
  if (availableBalance == null) return false
  return amountIn > availableBalance.amount
}
