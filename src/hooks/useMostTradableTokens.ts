import { type UseQueryResult, useQuery } from "@tanstack/react-query"

export type MostTradableTokenEntity = {
  symbol_out: string
  blockchain_out: string
  volume: number
}

export type MostTradableTokensResponse = {
  tokens: Array<MostTradableTokenEntity>
}

export function useMostTradableTokens<T>(
  tokenList: T[]
): UseQueryResult<MostTradableTokensResponse> {
  return useQuery<MostTradableTokensResponse>({
    queryKey: ["most-tradable-tokens", tokenList.length],
    queryFn: async () => {
      const response = await fetch("/api/stats/most_tradable_tokens")

      if (!response.ok) {
        throw new Error("Failed to fetch most tradable tokens")
      }
      return response.json()
    },
    enabled: tokenList.length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes (matches API revalidate)
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2,
  })
}
