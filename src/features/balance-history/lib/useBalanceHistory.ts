"use client"

import type { BalanceHistoryParams } from "@src/features/balance-history/types"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { fetchBalanceHistory } from "./balanceHistoryAPI"

const BALANCE_HISTORY_QUERY_KEY = "balance_history"

export function useBalanceHistory(
  params: Omit<BalanceHistoryParams, "page">,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [BALANCE_HISTORY_QUERY_KEY, params],
    queryFn: () => fetchBalanceHistory({ ...params, page: 1 }),
    enabled: options?.enabled ?? Boolean(params.accountId),
  })
}

export function useInfiniteBalanceHistory(
  params: Omit<BalanceHistoryParams, "page">,
  options?: { enabled?: boolean }
) {
  return useInfiniteQuery({
    queryKey: [BALANCE_HISTORY_QUERY_KEY, "infinite", params],
    queryFn: ({ pageParam }) =>
      fetchBalanceHistory({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: options?.enabled ?? Boolean(params.accountId),
    retry: false,
  })
}
