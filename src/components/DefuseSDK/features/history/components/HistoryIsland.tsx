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
import { useCallback, useEffect, useRef, useState } from "react"
import { Island } from "../../../components/Island"
import type { TokenInfo } from "../../../types/base"
import { cn } from "../../../utils/cn"
import { SwapHistoryItem, SwapHistoryItemSkeleton } from "./HistoryItem"

type RefreshState = "idle" | "refreshing" | "done"

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

  const {
    data,
    isLoading: isQueryLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
  } = useSwapHistory(
    { accountId: accountId ?? "", limit: 20 },
    { enabled: queryEnabled }
  )

  const isLoading =
    isWalletLoading || isQueryLoading || (queryEnabled && !data && isFetching)

  const [refreshState, setRefreshState] = useState<RefreshState>("idle")

  const handleRefresh = useCallback(async () => {
    setRefreshState("refreshing")
    try {
      await refetch()
      setRefreshState("done")
      setTimeout(() => setRefreshState("idle"), 1500)
    } catch {
      setRefreshState("idle")
    }
  }, [refetch])

  const items = data?.pages.flatMap((page) => page.data) ?? []
  const hasAttemptedLoad = !isLoading
  const isRefreshing = refreshState === "refreshing"
  const showDone = refreshState === "done"

  return (
    <Island className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold">Swap History</h2>
        {hasAttemptedLoad && Boolean(accountId) && !isError && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={cn(
              "p-1.5 rounded-lg transition-all duration-200",
              showDone
                ? "text-green-11 bg-green-3"
                : "text-gray-11 hover:text-gray-12 hover:bg-gray-3 active:bg-gray-4",
              isRefreshing && "opacity-70"
            )}
            title={showDone ? "Updated" : "Refresh"}
          >
            {showDone ? (
              <CheckIcon className="size-4" weight="bold" />
            ) : (
              <ArrowsClockwiseIcon
                className={cn("size-4 transition-transform duration-200", {
                  "animate-spin": isRefreshing,
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

  useEffect(() => {
    if (items.length > prevItemCount && prevItemCount > 0) {
      scrollContainerRef.current?.scrollBy({ top: 250, behavior: "smooth" })
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
