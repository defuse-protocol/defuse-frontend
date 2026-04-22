import type { TokenValue } from "@src/components/DefuseSDK/types/base"
import { useMemo } from "react"
import type { Context } from "../../../../machines/withdrawUIMachine"

type QuoteResult = Context["quoteResult"]

export function useMinWithdrawalAmountWithFeeEstimation(
  _parsedAmountIn: TokenValue | null,
  minWithdrawalAmount: TokenValue | null,
  quoteResult: QuoteResult
): TokenValue | null {
  return useMemo(() => {
    if (!minWithdrawalAmount) return null
    if (quoteResult?.tag !== "ok") return minWithdrawalAmount

    // Build a minimal state-like object to reuse the selector
    const fee = (() => {
      try {
        const amountIn = BigInt(quoteResult.value.quote.amountIn)
        const amountOut = BigInt(quoteResult.value.quote.amountOut)
        return amountIn > amountOut ? amountIn - amountOut : 0n
      } catch {
        return 0n
      }
    })()

    if (fee === 0n) return minWithdrawalAmount

    return {
      amount: minWithdrawalAmount.amount + fee,
      decimals: minWithdrawalAmount.decimals,
    }
  }, [minWithdrawalAmount, quoteResult])
}
