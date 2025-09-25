import type { PreparationOutput } from "@src/components/DefuseSDK/services/withdrawService"
import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { useMemo } from "react"

export function useMinWithdrawalAmountWithFeeEstimation(
  parsedAmountIn: TokenValue | null,
  minWithdrawalAmount: TokenValue | null,
  preparationOutput: PreparationOutput | null
): TokenValue | null {
  const minWithdrawalAmountWithFee = useMemo(() => {
    if (!minWithdrawalAmount) return null
    if (!preparationOutput) return minWithdrawalAmount

    const base = minWithdrawalAmount

    if (preparationOutput.tag === "ok") {
      const fee = preparationOutput.value.feeEstimation.amount
      return {
        amount: base.amount + fee,
        decimals: base.decimals,
      }
    }

    // This is fallback to amount with fee estimation on preparation error
    if (
      preparationOutput.tag === "err" &&
      preparationOutput.value.reason === "ERR_AMOUNT_TOO_LOW"
    ) {
      const shortfallAmount = preparationOutput.value.shortfall.amount
      return {
        amount: parsedAmountIn
          ? parsedAmountIn.amount + shortfallAmount
          : shortfallAmount,
        decimals: base.decimals,
      }
    }

    return base
  }, [minWithdrawalAmount, preparationOutput, parsedAmountIn])

  return minWithdrawalAmountWithFee
}
