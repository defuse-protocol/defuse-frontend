import type { BaseTokenInfo, TokenValue } from "../../types/base"
import { assert } from "../../utils/assert"
import { adjustDecimals, deduplicateTokens } from "../../utils/tokenUtils"
import { AmountMismatchError } from "./errors/amountMismatchError"

type TokenSlice = BaseTokenInfo
type Balances = Record<string, bigint>

/**
 * First sorting per decimals ascending - Reason: as fewer decimals have coverage problems, it is better to use them first
 * Second sorting per decimals descending - Reason: use less items to cover the split
 */
export function sortForOptimalAmountSplitting(
  uniqueTokensIn: BaseTokenInfo[],
  balances: Balances
): BaseTokenInfo[] {
  return structuredClone(uniqueTokensIn).sort((a, b) => {
    if (b.decimals < a.decimals) {
      return 1
    }
    if (b.decimals > a.decimals) {
      return -1
    }
    const aBalance = balances[a.defuseAssetId]
    const bBalance = balances[b.defuseAssetId]

    assert(aBalance != null)
    assert(bBalance != null)

    const maxDecimalBetweenAandB = Math.max(a.decimals, b.decimals) // taking max from decimals to ave cleaner comparing
    const aBalanceAdjusted = adjustDecimals(
      aBalance,
      a.decimals,
      maxDecimalBetweenAandB
    )
    const bBalanceAdjusted = adjustDecimals(
      bBalance,
      b.decimals,
      maxDecimalBetweenAandB
    )

    if (bBalanceAdjusted < aBalanceAdjusted) {
      return -1
    }

    if (bBalanceAdjusted > aBalanceAdjusted) {
      return 1
    }

    return 0
  })
}

/**
 * Function to calculate how to split the input amounts based on available balances.
 * Duplicate tokens are processed only once and their balances are considered only once.
 */
export function calculateSplitAmounts(
  tokensIn: TokenSlice[],
  amountIn: TokenValue,
  balances: Record<string, bigint>
): Record<string, bigint> {
  const unique = sortForOptimalAmountSplitting(
    deduplicateTokens(tokensIn),
    balances
  )

  // 1) no tokens → immediate error
  if (unique.length === 0) {
    throw new AmountMismatchError({
      requested: amountIn,
      fulfilled: { amount: 0n, decimals: amountIn.decimals },
      nextFulfillable: null,
    })
  }

  // 2) greedy fill in each token's own decimals
  let remaining = amountIn.amount
  const dec = amountIn.decimals
  const out: Record<string, bigint> = {}

  for (const t of unique) {
    const avail = balances[t.defuseAssetId] ?? 0n
    const need = adjustDecimals(remaining, dec, t.decimals)
    const take = avail < need ? avail : need
    if (take > 0n) {
      out[t.defuseAssetId] = take
      remaining -= adjustDecimals(take, t.decimals, dec)
    }
    if (remaining === 0n) break
  }

  // 3) if still short, build the error
  if (remaining !== 0n) {
    // what we did fill vs what's left
    const fulfilledAmt = amountIn.amount - remaining

    // total available in the input's decimals
    const totalAvail = unique
      .map((t) =>
        adjustDecimals(balances[t.defuseAssetId] ?? 0n, t.decimals, dec)
      )
      .reduce((sum, v) => sum + v, 0n)

    const oneUnit = 10n ** BigInt(dec)
    const nextAmt = ceilDiv(amountIn.amount, oneUnit) * oneUnit

    const nextFulfillable =
      totalAvail >= nextAmt ? { amount: nextAmt, decimals: dec } : null

    throw new AmountMismatchError({
      requested: amountIn,
      fulfilled: { amount: fulfilledAmt, decimals: dec },
      nextFulfillable: nextFulfillable,
    })
  }

  return out
}

const ceilDiv = (a: bigint, b: bigint) => (a + b - 1n) / b
