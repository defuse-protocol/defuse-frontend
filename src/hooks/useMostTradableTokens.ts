import {
  type MostTradableTokensResponse,
  getMostTradableTokens,
} from "@src/actions/mostTradableTokens"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export function useMostTradableTokens<T>(
  tokenList: T[]
): UseQueryResult<MostTradableTokensResponse> {
  return useQuery<MostTradableTokensResponse>({
    queryKey: ["most-tradable-tokens", tokenList.length],
    queryFn: getMostTradableTokens,
    enabled: tokenList.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}
