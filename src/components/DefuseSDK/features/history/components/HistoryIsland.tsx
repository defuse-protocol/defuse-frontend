"use client"

import { ClockCounterClockwise, Wallet } from "@phosphor-icons/react"
import type { BalanceChange } from "@src/features/balance-history"
import { useInfiniteBalanceHistory } from "@src/features/balance-history"
import { ButtonCustom } from "../../../components/Button/ButtonCustom"
import { Island } from "../../../components/Island"
import { IslandHeader } from "../../../components/IslandHeader"
import type { TokenInfo } from "../../../types/base"
import { HistoryItem, HistoryItemSkeleton } from "./HistoryItem"

interface HistoryIslandProps {
  accountId: string | null
  tokenList: TokenInfo[]
}

export function HistoryIsland({ accountId, tokenList }: HistoryIslandProps) {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteBalanceHistory(
      { accountId: accountId ?? "", limit: 20 },
      { enabled: Boolean(accountId) }
    )

  const items = data?.pages.flatMap((page) => page.data) ?? []

  return (
    <Island className="flex flex-col gap-8">
      <IslandHeader heading="Transaction History" />
      <Content
        isLoggedIn={Boolean(accountId)}
        items={items}
        isLoading={isLoading}
        tokenList={tokenList}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
      />
    </Island>
  )
}

function Content({
  isLoggedIn,
  items,
  isLoading,
  tokenList,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
}: {
  isLoggedIn: boolean
  items: BalanceChange[]
  isLoading: boolean
  tokenList: TokenInfo[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onLoadMore: () => void
}) {
  if (!isLoggedIn) {
    return <EmptyScreen type="connect" />
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (items.length === 0) {
    return <EmptyScreen type="empty" />
  }

  return (
    <div className="flex flex-col -mt-4">
      <div className="max-h-[500px] overflow-y-auto">
        {items.map((item, index) => (
          <HistoryItem
            key={`${item.transaction_hash}-${item.token_id}-${index}`}
            item={item}
            tokenList={tokenList}
          />
        ))}
      </div>

      {hasNextPage && (
        <ButtonCustom
          variant="secondary"
          size="sm"
          onClick={onLoadMore}
          isLoading={isFetchingNextPage}
          className="w-full mt-4"
        >
          Load more
        </ButtonCustom>
      )}
    </div>
  )
}

function EmptyScreen({ type }: { type: "connect" | "empty" }) {
  if (type === "connect") {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Wallet weight="bold" className="size-8 mb-2.5 text-gray-11" />
        <div className="text-sm font-bold mb-1">Connect your wallet</div>
        <div className="text-xs font-medium text-gray-11 text-center max-w-[250px]">
          Connect your wallet to see your transaction history
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      <ClockCounterClockwise
        weight="bold"
        className="size-8 mb-2.5 text-gray-11"
      />
      <div className="text-sm font-bold mb-1">No transactions yet</div>
      <div className="text-xs font-medium text-gray-11 text-center max-w-[250px]">
        Your transaction history will appear here once you make your first trade
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="-mt-4">
      <HistoryItemSkeleton />
      <HistoryItemSkeleton />
      <HistoryItemSkeleton />
      <HistoryItemSkeleton />
      <HistoryItemSkeleton />
    </div>
  )
}
