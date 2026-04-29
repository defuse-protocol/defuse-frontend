import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { adjustDecimals } from "@src/components/DefuseSDK/utils/tokenUtils"
import { useMemo } from "react"

export function useMinWithdrawalAmountWithFeeEstimation(
  minWithdrawalAmount: TokenValue | null,
  fee: TokenValue
): TokenValue | null {
  return useMemo(() => {
    if (!minWithdrawalAmount) return null
    if (fee.amount === 0n) return minWithdrawalAmount

    const normalizedMin = adjustDecimals(
      minWithdrawalAmount.amount,
      minWithdrawalAmount.decimals,
      fee.decimals
    )
    return {
      amount: normalizedMin + fee.amount,
      decimals: fee.decimals,
    }
  }, [minWithdrawalAmount, fee])
}
