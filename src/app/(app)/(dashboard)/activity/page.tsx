"use client"

import { ArrowPathIcon, CheckIcon } from "@heroicons/react/16/solid"
import { FunnelIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import type {
  StatusFilter,
  TypeFilter,
} from "@src/components/DefuseSDK/components/Modal/ModalActivityFilters"
import ModalActivityFilters from "@src/components/DefuseSDK/components/Modal/ModalActivityFilters"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import {
  HistoryItem,
  SwapHistoryItemSkeleton,
} from "@src/components/DefuseSDK/features/history/components/HistoryItem"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSwapHistory } from "@src/features/balance-history/lib/useBalanceHistory"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useVerifiedWalletsStore } from "@src/stores/useVerifiedWalletsStore"
import clsx from "clsx"
import { format, isToday, isYesterday } from "date-fns"
import { useRouter } from "next/navigation"
import {
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react"

const RefreshState = {
  IDLE: "idle",
  REFRESHING: "refreshing",
  DONE: "done",
} as const

type RefreshState = (typeof RefreshState)[keyof typeof RefreshState]

const MIN_REFRESH_SPINNER_MS = 1000

const TYPE_MAP: Record<Exclude<TypeFilter, "All">, SwapTransaction["type"]> = {
  Send: "withdrawal",
  Receive: "deposit",
  Swap: "swap",
}

const STATUS_MAP: Record<
  Exclude<StatusFilter, "All">,
  SwapTransaction["status"][]
> = {
  Success: ["SUCCESS"],
  Pending: ["PENDING", "PROCESSING"],
  Failed: ["FAILED"],
}

const POLLING_INITIAL_DELAY_MS = 20_000
const POLLING_INTERVAL_MS = 10_000
const MAX_POLLING_ATTEMPTS = 20
const RECENT_SWAP_THRESHOLD_MS = 2 * 60 * 60 * 1000

const getDateGroupLabel = (dateString: string): string => {
  const date = new Date(dateString)
  if (isToday(date)) return "Today"
  if (isYesterday(date)) return "Yesterday"
  return format(date, "MMM d, yyyy")
}

function groupBy<T>(arr: T[], keyFn: (item: T) => string): Record<string, T[]> {
  return arr.reduce(
    (acc, item) => {
      const key = keyFn(item)
      acc[key] = acc[key] || []
      acc[key].push(item)
      return acc
    },
    {} as Record<string, T[]>
  )
}

export default function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = use(searchParams)
  const router = useRouter()
  const { state, isLoading: isWalletConnecting } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const hasHydrated = useVerifiedWalletsStore((s) => s._hasHydrated)

  const [hadPreviousSession, setHadPreviousSession] = useState(true)
  useEffect(() => {
    setHadPreviousSession(localStorage.getItem("chainType") !== null)
  }, [])

  const userAddress = state.isVerified ? state.address : null
  const isWaitingForReconnect = hadPreviousSession && !state.address
  const isWalletHydrating =
    !hasHydrated ||
    isWalletConnecting ||
    isWaitingForReconnect ||
    Boolean(state.address && !state.isVerified)

  const currentSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParamsData)) {
    if (typeof value === "string") {
      currentSearchParams.set(key, value)
    }
  }

  const search = currentSearchParams.get("search") ?? ""
  const typeFilter = (currentSearchParams.get("type") as TypeFilter) || "All"
  const statusFilter =
    (currentSearchParams.get("status") as StatusFilter) || "All"
  const hasFilters = typeFilter !== "All" || statusFilter !== "All"

  const [isPending, startTransition] = useTransition()
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  const isSearching = Boolean(timeoutId || isPending)

  const [open, setOpen] = useState(false)
  const [pollingAttempts, setPollingAttempts] = useState(0)
  const [delayPassed, setDelayPassed] = useState(false)

  const {
    data,
    isLoading,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isError,
    refetch,
    dataUpdatedAt,
  } = useSwapHistory(
    { accountId: userAddress ?? "", limit: 20 },
    { enabled: Boolean(userAddress), refetchOnMount: "always" }
  )

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

  const isRefreshing = refreshState === RefreshState.REFRESHING
  const showDone = refreshState === RefreshState.DONE
  const isAnyRefetchHappening =
    isRefreshing || (isFetching && !isLoading && !isFetchingNextPage)

  const allTransactions = useMemo(
    () => data?.pages.flatMap((page) => page.data) ?? [],
    [data]
  )

  const transactions = useMemo(() => {
    let filtered = allTransactions

    if (typeFilter !== "All") {
      const targetType = TYPE_MAP[typeFilter]
      filtered = filtered.filter((tx) => tx.type === targetType)
    }

    if (statusFilter !== "All") {
      const targetStatuses = STATUS_MAP[statusFilter]
      filtered = filtered.filter((tx) => targetStatuses.includes(tx.status))
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (tx) =>
          tx.from.symbol.toLowerCase().includes(searchLower) ||
          tx.to.symbol.toLowerCase().includes(searchLower) ||
          tx.transaction_hash.toLowerCase().includes(searchLower) ||
          tx.deposit_address.toLowerCase().includes(searchLower)
      )
    }

    return filtered
  }, [allTransactions, typeFilter, statusFilter, search])

  const hasRecentPendingTransactions = useMemo(() => {
    const now = Date.now()
    return allTransactions.some((tx) => {
      if (tx.status !== "PENDING" && tx.status !== "PROCESSING") {
        return false
      }
      const txTime = new Date(tx.timestamp).getTime()
      return now - txTime < RECENT_SWAP_THRESHOLD_MS
    })
  }, [allTransactions])

  const shouldPoll =
    hasRecentPendingTransactions &&
    delayPassed &&
    pollingAttempts < MAX_POLLING_ATTEMPTS

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on account change
  useEffect(() => {
    setPollingAttempts(0)
    setDelayPassed(false)
  }, [userAddress])

  useEffect(() => {
    if (!hasRecentPendingTransactions) {
      setDelayPassed(false)
      return
    }
    if (delayPassed) return
    const t = setTimeout(() => setDelayPassed(true), POLLING_INITIAL_DELAY_MS)
    return () => clearTimeout(t)
  }, [hasRecentPendingTransactions, delayPassed])

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

  const groupedTransactions = useMemo(
    () => groupBy(transactions, (tx) => getDateGroupLabel(tx.timestamp)),
    [transactions]
  )

  const isWalletConnected = Boolean(userAddress)

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="text-gray-900 text-xl font-bold tracking-tight">
          Activity
        </h1>
        {isWalletConnected && !isLoading && !isError && (
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isAnyRefetchHappening}
            className={clsx(
              "p-1.5 rounded-lg transition-all duration-200",
              showDone
                ? "text-green-600 bg-green-50"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 active:bg-gray-200",
              isAnyRefetchHappening && "opacity-70"
            )}
            title={showDone ? "Updated" : "Refresh"}
          >
            {showDone ? (
              <CheckIcon className="size-4" />
            ) : (
              <ArrowPathIcon
                className={clsx("size-4", {
                  "animate-spin": isAnyRefetchHappening,
                })}
              />
            )}
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center gap-1">
        <SearchBar
          defaultValue={search}
          loading={isSearching}
          onChange={(e) => {
            clearTimeout(timeoutId)

            const id = setTimeout(() => {
              startTransition(() => {
                const newSearchParams = new URLSearchParams(currentSearchParams)

                if (e.target.value) {
                  newSearchParams.set("search", e.target.value)
                } else {
                  newSearchParams.delete("search")
                }

                const query = newSearchParams.toString()
                router.push(query ? `/activity?${query}` : "/activity")
                setTimeoutId(undefined)
              })
            }, 500)

            setTimeoutId(id)
          }}
          onClear={() => {
            const newSearchParams = new URLSearchParams(currentSearchParams)
            newSearchParams.delete("search")
            const query = newSearchParams.toString()
            router.push(query ? `/activity?${query}` : "/activity")
          }}
          placeholder="Search address or token"
          className="flex-1"
        />
        <Button
          size="lg"
          variant={hasFilters ? "primary" : "outline"}
          onClick={() => setOpen(true)}
        >
          <FunnelIcon className="size-4" />
          Filters
        </Button>
      </div>

      <section className="mt-10 space-y-10">
        {isWalletHydrating ? (
          <LoadingState />
        ) : (
          <>
            {!isWalletConnected && (
              <EmptyState message="Connect your wallet to see your activity" />
            )}

            {isWalletConnected && isLoading && <LoadingState />}

            {isWalletConnected && isError && (
              <EmptyState message="Failed to load activity. Please try again." />
            )}

            {isWalletConnected &&
              !isLoading &&
              !isError &&
              transactions.length === 0 && (
                <EmptyState
                  message={
                    allTransactions.length > 0
                      ? "No transactions match your filters"
                      : "No activity yet. Your transaction history will appear here."
                  }
                />
              )}

            {isWalletConnected &&
              !isLoading &&
              !isError &&
              transactions.length > 0 &&
              Object.entries(groupedTransactions).map(([date, dateTxs]) => (
                <div key={date}>
                  <h2 className="text-gray-900 text-base font-semibold">
                    {date}
                  </h2>
                  <div className="mt-2 flex flex-col">
                    {dateTxs.map((tx: SwapTransaction) => (
                      <HistoryItem
                        key={tx.id}
                        transaction={tx}
                        tokenList={tokenList}
                      />
                    ))}
                  </div>
                </div>
              ))}

            {isWalletConnected && hasNextPage && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => fetchNextPage()}
                  loading={isFetchingNextPage}
                >
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      <ModalActivityFilters
        open={open}
        onClose={() => setOpen(false)}
        currentSearchParams={currentSearchParams}
      />
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="text-gray-500 text-sm">{message}</p>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="space-y-10">
      <div>
        <div className="h-5 w-20 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="flex flex-col">
          <SwapHistoryItemSkeleton />
          <SwapHistoryItemSkeleton />
          <SwapHistoryItemSkeleton />
        </div>
      </div>
      <div>
        <div className="h-5 w-24 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="flex flex-col">
          <SwapHistoryItemSkeleton />
          <SwapHistoryItemSkeleton />
        </div>
      </div>
    </div>
  )
}
