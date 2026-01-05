"use client"

import {
  ArrowsClockwiseIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  WalletIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { useSwapHistory } from "@src/features/balance-history/lib/useBalanceHistory"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Island } from "../../../components/Island"
import type { TokenInfo } from "../../../types/base"
import { cn } from "../../../utils/cn"
import { SwapHistoryItem, SwapHistoryItemSkeleton } from "./HistoryItem"

type RefreshState = "idle" | "refreshing" | "done"

const POLLING_INITIAL_DELAY_MS = 20_000
const POLLING_INTERVAL_MS = 10_000
const MAX_POLLING_ATTEMPTS = 20
const RECENT_SWAP_THRESHOLD_MS = 2 * 60 * 60 * 1000
const MIN_REFRESH_SPINNER_MS = 1000

interface HistoryIslandProps {
  accountId: string | null
  tokenList: TokenInfo[]
  isWalletLoading?: boolean
}

export function HistoryIsland({
  accountId,
  tokenList,
  isWalletLoading = false,
}: HistoryIslandProps) {
  const queryEnabled = Boolean(accountId) && !isWalletLoading

  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [pollingEnabled, setPollingEnabled] = useState(false)
  const initialDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const {
    data,
    isLoading: isQueryLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    dataUpdatedAt,
  } = useSwapHistory(
    { accountId: accountId ?? "", limit: 20 },
    {
      enabled: queryEnabled,
      refetchInterval: pollingEnabled ? POLLING_INTERVAL_MS : false,
    }
  )

  const items = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const hasRecentPendingSwaps = useMemo(() => {
    const now = Date.now()
    return items.some((swap) => {
      if (swap.status !== "PENDING" && swap.status !== "PROCESSING") {
        return false
      }
      const swapTime = new Date(swap.timestamp).getTime()
      return now - swapTime < RECENT_SWAP_THRESHOLD_MS
    })
  }, [items])

  useEffect(() => {
    if (initialDelayTimerRef.current) {
      clearTimeout(initialDelayTimerRef.current)
      initialDelayTimerRef.current = null
    }

    if (hasRecentPendingSwaps && pollingAttempts < MAX_POLLING_ATTEMPTS) {
      if (!pollingEnabled) {
        initialDelayTimerRef.current = setTimeout(() => {
          setPollingEnabled(true)
        }, POLLING_INITIAL_DELAY_MS)
      }
    } else {
      setPollingEnabled(false)
    }

    return () => {
      if (initialDelayTimerRef.current) {
        clearTimeout(initialDelayTimerRef.current)
      }
    }
  }, [hasRecentPendingSwaps, pollingAttempts, pollingEnabled])

  useEffect(() => {
    if (pollingEnabled && dataUpdatedAt) {
      setPollingAttempts((prev) => prev + 1)
    }
  }, [dataUpdatedAt, pollingEnabled])

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on account change
  useEffect(() => {
    setPollingAttempts(0)
    setPollingEnabled(false)
  }, [accountId])

  const isLoading =
    isWalletLoading || isQueryLoading || (queryEnabled && !data && isFetching)

  const [refreshState, setRefreshState] = useState<RefreshState>("idle")
  const prevIsFetchingRef = useRef(isFetching)

  useEffect(() => {
    const wasBackgroundFetching =
      prevIsFetchingRef.current && !isLoading && !isFetchingNextPage
    const fetchJustCompleted = !isFetching && wasBackgroundFetching

    if (fetchJustCompleted && refreshState === "idle" && data) {
      setRefreshState("done")
      setTimeout(() => setRefreshState("idle"), 1500)
    }

    prevIsFetchingRef.current = isFetching
  }, [isFetching, isLoading, isFetchingNextPage, refreshState, data])

  const handleRefresh = useCallback(async () => {
    setRefreshState("refreshing")
    try {
      await Promise.all([
        refetch(),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_SPINNER_MS)),
      ])
      setRefreshState("done")
      setTimeout(() => setRefreshState("idle"), 1500)
      setPollingAttempts(0)
    } catch {
      setRefreshState("idle")
    }
  }, [refetch])

  const hasAttemptedLoad = !isLoading
  const isRefreshing = refreshState === "refreshing"
  const showDone = refreshState === "done"
  const isAnyRefetchHappening =
    isRefreshing || (isFetching && !isLoading && !isFetchingNextPage)

  return (
    <Island className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Swap History</h2>
        {hasAttemptedLoad && Boolean(accountId) && !isError && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isAnyRefetchHappening}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              showDone
                ? "text-green-11 bg-green-3"
                : "text-gray-11 hover:text-gray-12 hover:bg-gray-3 active:bg-gray-4",
              isAnyRefetchHappening && "opacity-70"
            )}
            title={showDone ? "Updated" : "Refresh"}
          >
            {showDone ? (
              <CheckIcon className="size-4" weight="bold" />
            ) : (
              <ArrowsClockwiseIcon
                className={cn("size-4 transition-transform duration-200", {
                  "animate-spin": isAnyRefetchHappening,
                })}
                weight="bold"
              />
            )}
          </button>
        )}
      </div>
      <Content
        isLoggedIn={Boolean(accountId)}
        items={items}
        isLoading={isLoading}
        isError={isError}
        tokenList={tokenList}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        onRetry={handleRefresh}
      />
    </Island>
  )
}

function Content({
  isLoggedIn,
  items,
  isLoading,
  isError,
  tokenList,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onRetry,
}: {
  isLoggedIn: boolean
  items: SwapTransaction[]
  isLoading: boolean
  isError: boolean
  tokenList: TokenInfo[]
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  onLoadMore: () => void
  onRetry: () => void
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [prevItemCount, setPrevItemCount] = useState(0)
  const wasLoadingMore = useRef(false)

  // Track when "load more" starts
  useEffect(() => {
    if (isFetchingNextPage) {
      wasLoadingMore.current = true
    }
  }, [isFetchingNextPage])

  // Only scroll down when "load more" completes (not on refresh)
  useEffect(() => {
    if (
      items.length > prevItemCount &&
      prevItemCount > 0 &&
      wasLoadingMore.current
    ) {
      scrollContainerRef.current?.scrollBy({ top: 250, behavior: "smooth" })
      wasLoadingMore.current = false
    }
    setPrevItemCount(items.length)
  }, [items.length, prevItemCount])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isLoggedIn) {
    return <EmptyScreen type="connect" />
  }

  if (isError) {
    return <ErrorScreen onRetry={onRetry} />
  }

  if (items.length === 0) {
    return <EmptyScreen type="empty" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="max-h-[500px] overflow-y-auto scroll-smooth scrollbar-offset"
        >
          {items.map((swap) => (
            <SwapHistoryItem key={swap.id} swap={swap} tokenList={tokenList} />
          ))}
        </div>
      </div>

      {hasNextPage && (
        <button
          type="button"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
          className="w-full py-2.5 px-4 text-sm font-medium text-gray-11 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 rounded-xl border border-gray-a5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isFetchingNextPage ? (
            <span className="flex items-center justify-center gap-2">
              <span className="size-4 border-2 border-gray-8 border-t-gray-11 rounded-full animate-spin" />
              Loading...
            </span>
          ) : (
            "Load more"
          )}
        </button>
      )}
    </div>
  )
}

function EmptyScreen({ type }: { type: "connect" | "empty" }) {
  if (type === "connect") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <WalletIcon weight="bold" className="size-8 mb-2.5 text-gray-11" />
        <div className="text-sm font-bold mb-1">Connect your wallet</div>
        <div className="text-xs font-medium text-gray-11 text-center max-w-[250px]">
          Connect your wallet to see your swap history
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <ClockCounterClockwiseIcon
        weight="bold"
        className="size-8 mb-2.5 text-gray-11"
      />
      <div className="text-sm font-bold mb-1">No swaps yet</div>
      <div className="text-xs font-medium text-gray-11 text-center max-w-[250px]">
        Your swap history will appear here once you make your first swap
      </div>
    </div>
  )
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <WarningCircleIcon weight="bold" className="size-8 mb-2.5 text-red-11" />
      <div className="text-sm font-bold mb-1">Could not load history</div>
      <div className="text-xs font-medium text-gray-11 text-center max-w-[250px] mb-3">
        Something went wrong while loading your swap history
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="px-4 py-1.5 text-xs font-medium text-gray-12 bg-gray-3 hover:bg-gray-4 active:bg-gray-5 rounded-lg border border-gray-a5 transition-colors"
      >
        Try again
      </button>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div>
      <SwapHistoryItemSkeleton />
      <SwapHistoryItemSkeleton />
      <SwapHistoryItemSkeleton />
      <SwapHistoryItemSkeleton />
      <SwapHistoryItemSkeleton />
    </div>
  )
}
