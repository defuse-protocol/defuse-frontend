import type { UseQueryResult } from "@tanstack/react-query"
import type { TokenUsdPriceData } from "../../../hooks/useTokensUsdPrices"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../../types/base"
import { formatTokenValue } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { computeTotalBalanceDifferentDecimals } from "../../../utils/tokenUtils"
import type { BalanceMapping } from "../../machines/depositedBalanceMachine"
import type { Holding } from "../types/sharedTypes"

export function computeTotalUsdValue(holdings: Holding[]) {
  return holdings.reduce((acc, { usdValue }) => {
    return usdValue == null ? acc : acc + usdValue
  }, 0)
}

export function combineBalances(
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[],
  [depositedBalanceQuery, transitBalanceQuery, tokensUsdPricesQuery]: [
    UseQueryResult<BalanceMapping, Error>,
    UseQueryResult<BalanceMapping, Error>,
    UseQueryResult<TokenUsdPriceData, Error>,
  ]
) {
  if (!depositedBalanceQuery.isSuccess) {
    return
  }

  return tokenList
    .map((token): Holding => {
      const value = computeTotalBalanceDifferentDecimals(
        token,
        depositedBalanceQuery.data ?? {},
        { strict: false }
      )

      const usdValue = value
        ? (getTokenUsdPrice(
            formatTokenValue(value.amount, value.decimals),
            token,
            tokensUsdPricesQuery.data
          ) ?? undefined)
        : undefined

      const transitValue = computeTotalBalanceDifferentDecimals(
        token,
        transitBalanceQuery.data ?? {},
        { strict: false }
      )

      const transitUsdValue = transitValue
        ? (getTokenUsdPrice(
            formatTokenValue(transitValue.amount, transitValue.decimals),
            token,
            tokensUsdPricesQuery.data
          ) ?? undefined)
        : undefined

      return {
        token,
        value,
        usdValue,
        transitValue,
        transitUsdValue,
      }
    })
    .filter(
      (h) =>
        (h.value && h.value.amount !== 0n) ||
        (h.transitValue && h.transitValue.amount !== 0n)
    )
    .sort((a, b) => {
      const totalValueA = (a.usdValue ?? 0) + (a.transitUsdValue ?? 0)
      const totalValueB = (b.usdValue ?? 0) + (b.transitUsdValue ?? 0)
      return totalValueB - totalValueA
    })
}
