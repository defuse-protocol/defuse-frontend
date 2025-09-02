import { getTokens } from "@src/components/DefuseSDK/features/machines/1cs"
import { useQuery } from "@tanstack/react-query"

export function use1csTokens() {
  return useQuery({
    queryKey: ["1cs-tokens"],
    queryFn: () => getTokens(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}
