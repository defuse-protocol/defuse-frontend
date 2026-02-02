"use client"

import {
  ArrowsClockwiseIcon,
  CheckIcon,
  ClockCounterClockwiseIcon,
  WalletIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react"
import { Skeleton } from "@radix-ui/themes"
import { useSwapHistory } from "@src/features/balance-history/lib/useBalanceHistory"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Island } from "../../../components/Island"
import type { TokenInfo } from "../../../types/base"
import { cn } from "../../../utils/cn"
import { HistoryItem } from "./HistoryItem"

const RefreshState = {
  IDLE: "idle",
  REFRESHING: "refreshing",
  DONE: "done",
} as const

type RefreshState = (typeof RefreshState)[keyof typeof RefreshState]

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
  const [delayPassed, setDelayPassed] = useState(false)

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
    { enabled: queryEnabled }
  )

  const currentItems = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const lastSuccessfulItems = useRef<SwapTransaction[]>([])

  useEffect(() => {
    if (currentItems.length > 0) {
      lastSuccessfulItems.current = currentItems
    }
  }, [currentItems])

  const items =
    isError && lastSuccessfulItems.current.length > 0
      ? lastSuccessfulItems.current
      : currentItems

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

  const shouldPoll =
    hasRecentPendingSwaps &&
    delayPassed &&
    pollingAttempts < MAX_POLLING_ATTEMPTS

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on account change
  useEffect(() => {
    setPollingAttempts(0)
    setDelayPassed(false)
    lastSuccessfulItems.current = []
  }, [accountId])

  useEffect(() => {
    if (!hasRecentPendingSwaps) {
      setDelayPassed(false)
      return
    }
    if (delayPassed) return
    const t = setTimeout(() => setDelayPassed(true), POLLING_INITIAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [hasRecentPendingSwaps, delayPassed])

  useEffect(() => {
    if (!shouldPoll) return
    const interval = setInterval(() => refetch(), POLLING_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [shouldPoll, refetch])

  useEffect(() => {
    if (shouldPoll && dataUpdatedAt) {
      setPollingAttempts((prev) => prev + 1)
    }
  }, [dataUpdatedAt, shouldPoll])

  const isLoading =
    isWalletLoading || isQueryLoading || (queryEnabled && !data && isFetching)

  const [refreshState, setRefreshState] = useState<RefreshState>(
    RefreshState.IDLE
  )
  const prevIsFetchingRef = useRef(isFetching)

  useEffect(() => {
    const wasBackgroundFetching =
      prevIsFetchingRef.current && !isLoading && !isFetchingNextPage
    const fetchJustCompleted = !isFetching && wasBackgroundFetching

    if (fetchJustCompleted && refreshState === RefreshState.IDLE && data) {
      setRefreshState(RefreshState.DONE)
      setTimeout(() => setRefreshState(RefreshState.IDLE), 1500)
    }

    prevIsFetchingRef.current = isFetching
  }, [isFetching, isLoading, isFetchingNextPage, refreshState, data])

  const handleRefresh = useCallback(async () => {
    setRefreshState(RefreshState.REFRESHING)
    try {
      await Promise.all([
        refetch(),
        new Promise((resolve) => setTimeout(resolve, MIN_REFRESH_SPINNER_MS)),
      ])
      setRefreshState(RefreshState.DONE)
      setTimeout(() => setRefreshState(RefreshState.IDLE), 1500)
      setPollingAttempts(0)
    } catch {
      setRefreshState(RefreshState.IDLE)
    }
  }, [refetch])

  const hasAttemptedLoad = !isLoading
  const isRefreshing = refreshState === RefreshState.REFRESHING
  const showDone = refreshState === RefreshState.DONE
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
                style={
                  isAnyRefetchHappening
                    ? { animationDuration: "0.75s" }
                    : undefined
                }
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
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    const sentinel = loadMoreTriggerRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          onLoadMoreRef.current()
        }
      },
      {
        root: container,
        rootMargin: "100px",
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage])

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!isLoggedIn) {
    return <EmptyScreen type="connect" />
  }

  if (items.length === 0) {
    if (isError) {
      return <ErrorScreen onRetry={onRetry} />
    }
    return <EmptyScreen type="empty" />
  }

  return (
    <div className="relative">
      <div
        ref={scrollContainerRef}
        className="max-h-[500px] overflow-y-auto scroll-smooth scrollbar-offset"
      >
        {items.map((swap) => (
          <HistoryItem key={swap.id} transaction={swap} tokenList={tokenList} />
        ))}

        {hasNextPage && <div ref={loadMoreTriggerRef} className="h-1" />}
        {isFetchingNextPage && <LoadingMoreIndicator />}
      </div>
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

function LoadingMoreIndicator() {
  return (
    <div className="flex justify-center py-4">
      <div className="flex items-center gap-1.5">
        <span className="size-1.5 bg-gray-9 rounded-full animate-pulse" />
        <span
          className="size-1.5 bg-gray-9 rounded-full animate-pulse"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="size-1.5 bg-gray-9 rounded-full animate-pulse"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  )
}

function SwapHistoryItemSkeleton() {
  return (
    <div className="-mx-4 px-4 rounded-2xl">
      <div className="flex gap-3 items-center py-3">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-[120px] shrink-0 flex items-center gap-2.5">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
          <Skeleton className="size-4 rounded shrink-0" />
          <div className="flex items-center gap-2.5 min-w-0">
            <Skeleton className="size-10 rounded-full shrink-0" />
            <div className="flex flex-col gap-0.5 min-w-0">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-10" />
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-0.5 shrink-0">
          <Skeleton className="h-5 w-14" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  )
}
