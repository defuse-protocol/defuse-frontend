import {
  type MostTradableTokensResponse,
  getMostTradableTokens,
} from "@src/actions/mostTradableTokens"
import { queryClient } from "@src/components/DefuseSDK/providers/QueryClientProvider"
import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export function useMostTradableTokens(): UseQueryResult<MostTradableTokensResponse> {
  return useQuery<MostTradableTokensResponse>({
    queryKey: ["most-tradable-tokens"],
    queryFn: getMostTradableTokens,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}

export const prefetchMostTradableTokens = async () => {
  await queryClient.prefetchQuery({
    queryKey: ["most-tradable-tokens"],
    queryFn: getMostTradableTokens,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}
