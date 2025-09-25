import { useQueries } from "@tanstack/react-query"
import { useMemo } from "react"
import { createTokenUsdPricesQueryOptions } from "../../../hooks/useTokensUsdPrices"
import { createDepositedBalanceQueryOptions } from "../../../queries/balanceQueries"
import type { TokenInfo } from "../../../types/base"
import type { IntentsUserId } from "../../../types/intentsUserId"
import { getTokenId } from "../../../utils/token"
import { getUnderlyingBaseTokenInfos } from "../../../utils/tokenUtils"
import { createTransitBalanceQueryOptions } from "../queries/balanceQueries"
import { combineBalances } from "../utils/holdingsUtils"

export function useWatchHoldings({
  userId,
  tokenList,
}: {
  userId: IntentsUserId | null
  tokenList: TokenInfo[]
}) {
  const tokenIds = useMemo(
    () =>
      tokenList.flatMap((t) => getUnderlyingBaseTokenInfos(t)).map(getTokenId),
    [tokenList]
  )

  return useQueries({
    queries: [
      createDepositedBalanceQueryOptions({ userId, tokenIds }),
      createTransitBalanceQueryOptions({ userId }),
      createTokenUsdPricesQueryOptions(),
    ],
    combine: (results) => combineBalances(tokenList, results),
  })
}
