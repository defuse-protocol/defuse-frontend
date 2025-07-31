import type { QueryObserverOptions } from "@tanstack/react-query"
import { getTransitBalance } from "../../../services/getTransitBalance"
import type { IntentsUserId } from "../../../types/intentsUserId"
import { assert } from "../../../utils/assert"
import type { BalanceMapping } from "../../machines/depositedBalanceMachine"

export function createTransitBalanceQueryOptions({
  userId,
}: { userId: null | IntentsUserId }) {
  return {
    queryKey: ["intents_sdk.transit_balance", { userId }],
    queryFn: ({ queryKey }) => {
      assert(queryKey[1].userId != null)
      return getTransitBalance(queryKey[1].userId)
    },
    enabled: (query) => query.queryKey[1].userId != null,
    refetchInterval: 10000,
  } satisfies QueryObserverOptions<
    BalanceMapping,
    Error,
    BalanceMapping,
    BalanceMapping,
    [string, { userId: null | IntentsUserId }]
  >
}
