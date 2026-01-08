"use client"

import { FunnelIcon } from "@heroicons/react/16/solid"
import Button from "@src/components/Button"
import ModalActivityFilters from "@src/components/DefuseSDK/components/Modal/ModalActivityFilters"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import type { Transaction } from "@src/components/DefuseSDK/features/account/types/sharedTypes"
import TransactionItem from "@src/components/TransactionItem"
import { format, isToday, isYesterday } from "date-fns"
import { useRouter } from "next/navigation"
import { use, useState, useTransition } from "react"

const transactions: Transaction[] = [
  {
    id: "1",
    type: "send",
    date: "2025-12-31T14:30:00.000Z",
    token: "BTC",
    amount: 0.0033,
    usdValue: 349.22,
    address: "bc1pvvkj8m5anlxg7d2kg4t6qf5lu2pgrmxr9eqk",
  },
  {
    id: "2",
    type: "receive",
    date: "2025-12-31T11:15:00.000Z",
    token: "ETH",
    amount: 1.02935,
    usdValue: 3972.26,
    address: "0xCE80a7a9C8E7bF54d2eA3D45c91bE56Ff2b3",
  },
  {
    id: "3",
    type: "swap",
    date: "2025-12-31T09:45:00.000Z",
    token: "USDT",
    amount: 4039.39,
    usdValue: 4039.39,
    toToken: "USDC",
    toAmount: 4039.85,
  },
  {
    id: "4",
    type: "receive",
    date: "2025-12-30T18:20:00.000Z",
    token: "SOL",
    amount: 12.5,
    usdValue: 2437.5,
    address: "7xKXtQb3vR9mN2wL8pYcZ4aE6fH1jK5sMn9p",
  },
  {
    id: "5",
    type: "send",
    date: "2025-12-30T15:00:00.000Z",
    token: "BNB",
    amount: 2.75,
    usdValue: 1925.0,
    address: "0x4F21bC7e9A3d82fE6c1B45D09a7F38c3D",
  },
  {
    id: "6",
    type: "swap",
    date: "2025-12-30T10:30:00.000Z",
    token: "ETH",
    amount: 0.5,
    usdValue: 1925.0,
    toToken: "BTC",
    toAmount: 0.0182,
  },
  {
    id: "7",
    type: "receive",
    date: "2025-12-29T22:45:00.000Z",
    token: "XRP",
    amount: 1500,
    usdValue: 3375.0,
    address: "rN7n3GDi8XxqV5WmPK2tZ9rJ4hXq2z",
  },
  {
    id: "8",
    type: "send",
    date: "2025-12-29T16:10:00.000Z",
    token: "DOGE",
    amount: 5000,
    usdValue: 1750.0,
    address: "DH5yaLpR7xWq9mKvN2bJ8cZtG4fkL9m",
  },
  {
    id: "9",
    type: "swap",
    date: "2025-12-29T09:00:00.000Z",
    token: "SOL",
    amount: 8.25,
    usdValue: 1608.75,
    toToken: "ETH",
    toAmount: 0.418,
  },
  {
    id: "10",
    type: "receive",
    date: "2025-12-28T20:30:00.000Z",
    token: "ADA",
    amount: 3500,
    usdValue: 3850.0,
    address:
      "addr1qx2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3n0d3vllmyqwsx5wktcd8cc3sq835lu7drv2xwl2wywfgs7n2x",
  },
  {
    id: "11",
    type: "send",
    date: "2025-12-28T14:15:00.000Z",
    token: "TON",
    amount: 150,
    usdValue: 825.0,
    address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
  },
  {
    id: "12",
    type: "swap",
    date: "2025-12-28T08:45:00.000Z",
    token: "BTC",
    amount: 0.015,
    usdValue: 1587.0,
    toToken: "USDC",
    toAmount: 1587.0,
  },
  {
    id: "13",
    type: "receive",
    date: "2025-12-27T19:20:00.000Z",
    token: "USDC",
    amount: 10000,
    usdValue: 10000.0,
    address: "0x9A3c7D2e5F18bB64aC90dE3f1A47b82Ce5F1",
  },
  {
    id: "14",
    type: "send",
    date: "2025-12-27T12:00:00.000Z",
    token: "ETH",
    amount: 2.5,
    usdValue: 9625.0,
    address: "0x7B2d9E4c1A58fF37bD62cE80a9F15D34aE8",
  },
  {
    id: "15",
    type: "swap",
    date: "2025-12-27T07:30:00.000Z",
    token: "XRP",
    amount: 2000,
    usdValue: 4500.0,
    toToken: "SOL",
    toAmount: 23.08,
  },
  {
    id: "16",
    type: "receive",
    date: "2025-12-26T21:45:00.000Z",
    token: "BNB",
    amount: 5.0,
    usdValue: 3500.0,
    address: "0x1C8eF5a2D73b94cE60fA21B87d3E96c9dB2",
  },
  {
    id: "17",
    type: "send",
    date: "2025-12-26T15:30:00.000Z",
    token: "SOL",
    amount: 25,
    usdValue: 4875.0,
    address: "3xZYtRq8mN2vK5wL9pJcB7aD4fH6gE1spK7m",
  },
  {
    id: "18",
    type: "swap",
    date: "2025-12-26T10:00:00.000Z",
    token: "DOGE",
    amount: 10000,
    usdValue: 3500.0,
    toToken: "BNB",
    toAmount: 5.0,
  },
  {
    id: "19",
    type: "receive",
    date: "2025-12-25T18:15:00.000Z",
    token: "BTC",
    amount: 0.05,
    usdValue: 5290.0,
    address: "bc1qxvk2m9n3p5w7r8t1y4u6i0o2a3s5d7z4p",
  },
  {
    id: "20",
    type: "send",
    date: "2025-12-25T11:00:00.000Z",
    token: "ADA",
    amount: 2000,
    usdValue: 2200.0,
    address: "addr1v8yg7k5q2m3n6p4r7t9w1x8c5v2b0n3m6l9k2j5h8g4f1d4k8w",
  },
]

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

const groupedTransactions = groupBy(transactions, (tx) =>
  getDateGroupLabel(tx.date)
)

export default function ActivityPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParamsData = use(searchParams)
  const router = useRouter()

  const currentSearchParams = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParamsData)) {
    if (typeof value === "string") {
      currentSearchParams.set(key, value)
    }
  }

  const search = currentSearchParams.get("search") ?? ""
  const hasFilters =
    currentSearchParams.has("type") || currentSearchParams.has("status")

  const [isPending, startTransition] = useTransition()
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>()
  const isSearching = Boolean(timeoutId || isPending)

  const [open, setOpen] = useState(false)

  return (
    <>
      <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
        Activity
      </h1>

      <div className="mt-6 flex items-center gap-1">
        <SearchBar
          defaultValue={search}
          loading={isSearching}
          onChange={(e) => {
            clearTimeout(timeoutId)

            const id = setTimeout(() => {
              startTransition(() => {
                // Clone currentSearchParams and only modify the search param
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
        {Object.entries(groupedTransactions).map(([date, transactions]) => (
          <div key={date}>
            <h2 className="text-gray-900 text-base font-semibold">{date}</h2>
            <div className="mt-2 flex flex-col gap-1">
              {transactions.map((transaction) => (
                <TransactionItem key={transaction.id} {...transaction} />
              ))}
            </div>
          </div>
        ))}
      </section>

      <ModalActivityFilters
        open={open}
        onClose={() => setOpen(false)}
        currentSearchParams={currentSearchParams}
      />
    </>
  )
}
