"use client"

import { FunnelIcon } from "@heroicons/react/16/solid"
import { ArrowPathIcon, CheckIcon } from "@heroicons/react/20/solid"
import Button from "@src/components/Button"
import type {
  StatusFilter,
  TypeFilter,
} from "@src/components/DefuseSDK/components/Modal/ModalActivityFilters"
import ModalActivityFilters from "@src/components/DefuseSDK/components/Modal/ModalActivityFilters"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import { HistoryItem } from "@src/components/DefuseSDK/features/history/components/HistoryItem"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { findTokenByAssetId } from "@src/components/DefuseSDK/utils/token"
import EmptyState from "@src/components/EmptyState"
import ListItemsSkeleton from "@src/components/ListItemsSkeleton"
import PageHeader from "@src/components/PageHeader"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSwapHistory } from "@src/features/balance-history/lib/useBalanceHistory"
import type { SwapTransaction } from "@src/features/balance-history/types"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { useWalletTokensStore } from "@src/stores/useWalletTokensStore"
import clsx from "clsx"
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
  Swap: "swap",
}

const STATUS_MAP: Record<
  Exclude<StatusFilter, "All">,
  SwapTransaction["status"][]
> = {
  Success: ["SUCCESS"],
  Failed: ["FAILED"],
}

const POLLING_INITIAL_DELAY_MS = 20_000
const POLLING_INTERVAL_MS = 10_000
const MAX_POLLING_ATTEMPTS = 20
const RECENT_SWAP_THRESHOLD_MS = 2 * 60 * 60 * 1000

export default function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = use(searchParams)
  const router = useRouter()
  const { state, isLoading: isWalletConnecting } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const hasHydrated = useWalletTokensStore((s) => s._hasHydrated)

  const [hadPreviousSession, setHadPreviousSession] = useState(true)
  useEffect(() => {
    setHadPreviousSession(localStorage.getItem("chainType") !== null)
  }, [])

  const userAddress = state.isAuthorized ? state.address : null
  const isWaitingForReconnect = hadPreviousSession && !state.address
  const isWalletHydrating =
    !hasHydrated ||
    isWalletConnecting ||
    isWaitingForReconnect ||
    Boolean(state.address && !state.isAuthorized)

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
  const [shouldPoll, setShouldPoll] = useState(false)

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
    {
      enabled: Boolean(userAddress),
      refetchOnMount: "always",
      refetchInterval: shouldPoll ? POLLING_INTERVAL_MS : false,
    }
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
    } else {
      // By default, hide pending/processing transactions
      filtered = filtered.filter(
        (tx) => tx.status !== "PENDING" && tx.status !== "PROCESSING"
      )
    }

    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter((tx) => {
        const fromToken = findTokenByAssetId(tokenList, tx.from.token_id)
        const toToken = findTokenByAssetId(tokenList, tx.to.token_id)

        return (
          fromToken?.symbol.toLowerCase().includes(searchLower) ||
          toToken?.symbol.toLowerCase().includes(searchLower) ||
          fromToken?.name?.toLowerCase().includes(searchLower) ||
          toToken?.name?.toLowerCase().includes(searchLower)
        )
      })
    }

    return filtered
  }, [allTransactions, typeFilter, statusFilter, search, tokenList])

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset on account change
  useEffect(() => {
    setPollingAttempts(0)
    setDelayPassed(false)
    setShouldPoll(false)
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
    const newShouldPoll =
      hasRecentPendingTransactions &&
      delayPassed &&
      pollingAttempts < MAX_POLLING_ATTEMPTS
    setShouldPoll(newShouldPoll)
  }, [hasRecentPendingTransactions, delayPassed, pollingAttempts])

  useEffect(() => {
    if (shouldPoll && dataUpdatedAt) {
      setPollingAttempts((prev) => prev + 1)
    }
  }, [dataUpdatedAt, shouldPoll])

  const isWalletConnected = Boolean(userAddress)

  return (
    <>
      <PageHeader
        title="History"
        subtitle="Every transaction, at a glance"
        intro={
          <p>
            This is your history page, showing your past swaps. In the future,
            additional types of account activity will be shown, such as deposits
            and withdrawals, and services such as transaction export will be
            added.
          </p>
        }
      >
        <div className="h-9">
          {isWalletConnected && !isLoading && !isError && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isAnyRefetchHappening}
              className={clsx(
                "size-9 flex items-center justify-center transition-colors rounded-lg",
                showDone
                  ? "bg-green-50 text-green-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100",
                isAnyRefetchHappening && "opacity-70"
              )}
              title={showDone ? "Updated" : "Refresh"}
            >
              {showDone ? (
                <CheckIcon className="size-5" />
              ) : (
                <ArrowPathIcon
                  className={clsx("size-5", {
                    "animate-spin": isAnyRefetchHappening,
                  })}
                />
              )}
            </button>
          )}
        </div>
      </PageHeader>

      <div className="mt-7 flex items-center gap-1">
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
                router.push(query ? `/history?${query}` : "/history")
                setTimeoutId(undefined)
              })
            }, 500)

            setTimeoutId(id)
          }}
          onClear={() => {
            const newSearchParams = new URLSearchParams(currentSearchParams)
            newSearchParams.delete("search")
            const query = newSearchParams.toString()
            router.push(query ? `/history?${query}` : "/history")
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

      <section className="mt-6 space-y-1">
        {isWalletHydrating ? (
          <ListItemsSkeleton count={3} loading />
        ) : (
          <>
            {!isWalletConnected && (
              <EmptyState>
                <EmptyState.Title>
                  Please sign in to see your activity history.
                </EmptyState.Title>
              </EmptyState>
            )}

            {isWalletConnected && isLoading && (
              <ListItemsSkeleton count={3} loading />
            )}

            {isWalletConnected && isError && (
              <EmptyState>
                <EmptyState.Title>
                  We were unable to retrieve your activity history. This is a
                  technical error on our side. Please try again.
                </EmptyState.Title>
              </EmptyState>
            )}

            {isWalletConnected &&
              !isLoading &&
              !isError &&
              transactions.length === 0 && (
                <EmptyState>
                  <EmptyState.Title>
                    {allTransactions.length > 0
                      ? "No transactions match your filters"
                      : "No history yet. Your transactions will appear here."}
                  </EmptyState.Title>
                </EmptyState>
              )}

            {isWalletConnected &&
              !isLoading &&
              !isError &&
              transactions.length > 0 && (
                <TransactionList
                  transactions={transactions}
                  tokenList={tokenList}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                  onLoadMore={fetchNextPage}
                />
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

interface TransactionListProps {
  transactions: SwapTransaction[]
  tokenList: TokenInfo[]
  hasNextPage: boolean | undefined
  isFetchingNextPage: boolean
  onLoadMore: () => void
}

function TransactionList({
  transactions,
  tokenList,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: TransactionListProps) {
  const loadMoreTriggerRef = useRef<HTMLDivElement>(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  useEffect(() => {
    const sentinel = loadMoreTriggerRef.current
    if (!sentinel || !hasNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isFetchingNextPage) {
          onLoadMoreRef.current()
        }
      },
      { rootMargin: "200px", threshold: 0 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage])

  return (
    <>
      {transactions.map((tx: SwapTransaction) => (
        <HistoryItem key={tx.id} transaction={tx} tokenList={tokenList} />
      ))}
      {hasNextPage && <div ref={loadMoreTriggerRef} className="h-1" />}
      {isFetchingNextPage && <ListItemsSkeleton count={3} loading />}
    </>
  )
}
