import type { TokenValue } from "@src/components/DefuseSDK/types/base"

/**
 * Returns the minimum withdrawal amount.
 * Previously this hook calculated fee adjustments from preparationOutput,
 * but the 1cs flow no longer uses preparationOutput.
 */
export function useMinWithdrawalAmountWithFeeEstimation(
  _parsedAmountIn: TokenValue | null,
  minWithdrawalAmount: TokenValue | null
): TokenValue | null {
  return minWithdrawalAmount
}
