"use client"

import type { SwapHistoryParams } from "@src/features/balance-history/types"
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query"
import { fetchSwapHistory } from "./balanceHistoryAPI"

const SWAP_HISTORY_QUERY_KEY = "swap_history"

export interface UseSwapHistoryOptions {
  enabled?: boolean
  refetchInterval?: number | false
  refetchOnMount?: boolean | "always"
}

export function useSwapHistory(
  params: Omit<SwapHistoryParams, "page">,
  options?: UseSwapHistoryOptions
) {
  return useInfiniteQuery({
    queryKey: [SWAP_HISTORY_QUERY_KEY, params],
    queryFn: ({ pageParam }) =>
      fetchSwapHistory({ ...params, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasMore ? lastPage.pagination.page + 1 : undefined,
    enabled: options?.enabled ?? Boolean(params.accountId),
    staleTime: 30_000, // 30 seconds - prevents unnecessary refetches
    retry: 1,
    refetchInterval: options?.refetchInterval,
    refetchOnMount: options?.refetchOnMount ?? "always",
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData, // Keep showing previous data while refetching
  })
}
