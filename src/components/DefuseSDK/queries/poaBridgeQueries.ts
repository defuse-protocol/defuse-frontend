import { poaBridge } from "@defuse-protocol/internal-utils"
import { useQuery } from "@tanstack/react-query"
import type { TokenInfo } from "../types/base"
import {
  filterOutPoaBridgeTokens,
  getTokenAccountIds,
} from "../utils/tokenUtils"

export function useTokenBalancesQuery(token: TokenInfo, enabled = true) {
  const onlyPoaTokens = filterOutPoaBridgeTokens(token)
  const addresses = getTokenAccountIds(onlyPoaTokens)

  return useQuery({
    queryKey: ["intents_sdk.token_balances", addresses.slice().sort()],
    queryFn: () => poaBridge.httpClient.getTokenBalancesRequest(addresses),
    staleTime: 60 * 1000, // 1 min
    gcTime: 60 * 1000, // 1 min
    enabled: addresses.length > 0 && enabled,
  })
}
