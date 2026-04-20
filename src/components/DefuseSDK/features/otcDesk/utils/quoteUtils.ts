import { logNoLiquidity } from "@src/utils/logCustom"
import { Err, Ok, type Result } from "@thames/monads"
import type { BaseTokenInfo } from "../../../types/base"
import { getInternalQuote } from "../../machines/1cs"

export type AggregatedQuoteErr = { reason: "NO_QUOTES" }

export type QuoteExactInParams = {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
}

/**
 * Validates liquidity for multiple token swaps in parallel via the 1-Click API.
 *
 * Used by the OTC taker flow: when a taker fills an order, they may not hold
 * the exact tokens required. This checks that the required swaps are feasible
 * before the taker signs the intent. Quote data (hashes, deltas) is not
 * consumed downstream — only the success/failure signal matters.
 */
export async function validateLiquidity(
  swapParams: QuoteExactInParams[],
  resolveToken?: (defuseAssetId: string) => BaseTokenInfo | undefined
): Promise<Result<true, AggregatedQuoteErr>> {
  if (swapParams.length === 0) {
    return Ok(true)
  }

  const results = await Promise.allSettled(
    swapParams.map(({ tokenIn, tokenOut, amountIn }) =>
      getInternalQuote({
        originAsset: tokenIn,
        destinationAsset: tokenOut,
        amount: amountIn.toString(),
      })
    )
  )

  let anyFailed = false
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === "rejected") {
      anyFailed = true
      if (resolveToken) {
        const param = swapParams[i]
        if (param) {
          logNoLiquidity({
            tokenIn: resolveToken(param.tokenIn),
            tokenOut: resolveToken(param.tokenOut),
            amount: param.amountIn.toString(),
          })
        }
      }
    }
  }

  if (anyFailed) {
    return Err({ reason: "NO_QUOTES" as const })
  }

  return Ok(true)
}

/**
 * Returns the maximum of minDeadlineMs and timeEstimateMs as an ISO string.
 * @param minDeadlineMs - The minimum deadline in milliseconds.
 * @param timeEstimateMs - The time estimate in milliseconds. Optional.
 * @returns ISO string of the deadline (current time + the greater of the two values).
 * @example
 * getMinDeadlineMs(600000) // "2026-01-01T12:10:00.000Z" (10 min from now)
 * getMinDeadlineMs(600000, 10000) // "2026-01-01T12:10:00.000Z" (10 min from now)
 * getMinDeadlineMs(600000, 1260000) // "2026-01-01T12:21:00.000Z" (21 min from now)
 */
export function getMinDeadlineMs(
  minDeadlineMs: number,
  timeEstimateMs?: number
): string {
  const deadlineMs = Math.max(minDeadlineMs, timeEstimateMs ?? 0)
  return new Date(Date.now() + deadlineMs).toISOString()
}
