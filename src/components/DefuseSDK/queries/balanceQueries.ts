import appQueryClient from "@src/constants/queryClient"
import type { QueryObserverOptions } from "@tanstack/react-query"
import { nearClient } from "../constants/nearClient"
import type { BalanceMapping } from "../features/machines/depositedBalanceMachine"
import { getDepositedBalances } from "../services/defuseBalanceService"
import type { IntentsUserId } from "../types/intentsUserId"
import { assert } from "../utils/assert"

export function invalidateBalanceQueries() {
  void appQueryClient.invalidateQueries({
    queryKey: ["intents_sdk.deposited_balance"],
  })
  void appQueryClient.invalidateQueries({
    queryKey: ["intents_sdk.transit_balance"],
  })
}

export function createDepositedBalanceQueryOptions(
  { userId, tokenIds }: { userId: null | IntentsUserId; tokenIds: string[] },
  enabled = true
) {
  return {
    queryKey: ["intents_sdk.deposited_balance", { userId, tokenIds }],
    queryFn: async ({ queryKey }) => {
      assert(queryKey[1].userId != null)

      return getDepositedBalances(
        queryKey[1].userId,
        queryKey[1].tokenIds,
        nearClient
      )
    },
    enabled: (query) => query.queryKey[1].userId != null && enabled,
    refetchInterval: 10000,
  } satisfies QueryObserverOptions<
    BalanceMapping,
    Error,
    BalanceMapping,
    BalanceMapping,
    [string, { userId: null | IntentsUserId; tokenIds: string[] }]
  >
}
