import type { BaseTokenInfo, TokenInfo } from "../../types/base"
import {
  adjustDecimals,
  adjustDecimalsTokenValue,
  getUnderlyingBaseTokenInfos,
} from "../../utils/tokenUtils"
import type { BalanceMapping } from "./depositedBalanceMachine"

export function selectQuoteInputToken({
  tokenIn,
  parsedAmount,
  balances,
  siblingCandidates,
}: {
  tokenIn: TokenInfo
  parsedAmount: { amount: bigint; decimals: number }
  balances: BalanceMapping
  siblingCandidates?: BaseTokenInfo[]
}): {
  tokenIn: BaseTokenInfo
  amount: { amount: bigint; decimals: number }
} | null {
  const candidates = getUnderlyingBaseTokenInfos(tokenIn)
  if (candidates.length === 0) return null

  let selected: BaseTokenInfo | null = null
  let selectedBalance = 0n
  let selectedComparableBalance = 0n

  for (const candidate of candidates) {
    const balance = balances[candidate.defuseAssetId] ?? 0n
    const comparableBalance = adjustDecimals(
      balance,
      candidate.decimals,
      parsedAmount.decimals
    )

    if (selected == null || comparableBalance > selectedComparableBalance) {
      selected = candidate
      selectedBalance = balance
      selectedComparableBalance = comparableBalance
    }
  }

  if (selected == null) return null

  const adjustedAmount = adjustDecimalsTokenValue(
    parsedAmount,
    selected.decimals
  )
  if (selectedBalance < adjustedAmount.amount) {
    if (siblingCandidates != null) {
      const nonZeroSiblings = Object.values(
        siblingCandidates.reduce<Record<string, BaseTokenInfo>>(
          (acc, token) => {
            if (token.defuseAssetId in acc) return acc
            if ((balances[token.defuseAssetId] ?? 0n) > 0n) {
              acc[token.defuseAssetId] = token
            }
            return acc
          },
          {}
        )
      )

      if (nonZeroSiblings.length === 1 && nonZeroSiblings[0] != null) {
        const sibling = nonZeroSiblings[0]
        const siblingBalance = balances[sibling.defuseAssetId] ?? 0n
        const siblingAdjustedAmount = adjustDecimalsTokenValue(
          parsedAmount,
          sibling.decimals
        )

        if (siblingBalance >= siblingAdjustedAmount.amount) {
          return {
            tokenIn: sibling,
            amount: siblingAdjustedAmount,
          }
        }
      }
    }

    return null
  }

  return {
    tokenIn: selected,
    amount: adjustedAmount,
  }
}
