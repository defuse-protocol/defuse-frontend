"use client"

import {
  BtcIcon,
  EthIcon,
  NearIcon,
  SolIcon,
  UsdcIcon,
  UsdtIcon,
} from "@src/icons"
import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react"

type KeyValueRow = {
  label: string
  value: ReactNode
}

export type DockItem = {
  id: string
  title: string
  icons: ReactNode[]
  explorerUrl?: string
  keyValueRows: KeyValueRow[]
  renderContent?: () => ReactNode
  isSettled?: boolean
  createdAt: number
  settledAt?: number
}

type ActivityDockContextType = {
  dockItems: DockItem[]
  addDockItem: (item: Omit<DockItem, "createdAt" | "settledAt">) => void
  updateDockItem: (id: string, updates: Partial<Omit<DockItem, "id">>) => void
  removeDockItem: (id: string) => void
  settleDockItem: (id: string) => void
  hasDockItem: (id: string) => boolean
  clearDockItems: () => void
}

const ActivityDockContext = createContext<ActivityDockContextType | undefined>(
  undefined
)

// Fake items for testing - remove in production
const FAKE_DOCK_ITEMS: DockItem[] = [
  {
    id: "swap-1",
    title: "Swap ETH → USDC",
    icons: [
      <EthIcon key="eth" className="size-7" />,
      <UsdcIcon key="usdc" className="size-7" />,
    ],
    explorerUrl: "https://etherscan.io/tx/0x123",
    keyValueRows: [
      { label: "From", value: "1.5 ETH" },
      { label: "To", value: "2,847.32 USDC" },
      { label: "Rate", value: "1 ETH = 1,898.21 USDC" },
    ],
    isSettled: true,
    createdAt: Date.now() - 300000,
    settledAt: Date.now() - 240000,
  },
  {
    id: "swap-2",
    title: "Swap NEAR → BTC",
    icons: [
      <NearIcon key="near" className="size-7" />,
      <BtcIcon key="btc" className="size-7" />,
    ],
    explorerUrl: "https://nearblocks.io/tx/abc123",
    keyValueRows: [
      { label: "From", value: "500 NEAR" },
      { label: "To", value: "0.0234 BTC" },
      { label: "Status", value: "Processing..." },
    ],
    isSettled: false,
    createdAt: Date.now() - 60000,
  },
  {
    id: "bridge-1",
    title: "Bridge USDT to Polygon",
    icons: [<UsdtIcon key="usdt" className="size-7" />],
    keyValueRows: [
      { label: "Amount", value: "1,000 USDT" },
      { label: "From Chain", value: "Ethereum" },
      { label: "To Chain", value: "Polygon" },
      { label: "Est. Time", value: "~10 minutes" },
    ],
    isSettled: false,
    createdAt: Date.now() - 120000,
  },
  {
    id: "swap-3",
    title: "Swap SOL → USDT",
    icons: [
      <SolIcon key="sol" className="size-7" />,
      <UsdtIcon key="usdt" className="size-7" />,
    ],
    explorerUrl: "https://solscan.io/tx/xyz789",
    keyValueRows: [
      { label: "From", value: "25 SOL" },
      { label: "To", value: "3,125.50 USDT" },
      { label: "Fee", value: "0.00025 SOL" },
    ],
    isSettled: true,
    createdAt: Date.now() - 600000,
    settledAt: Date.now() - 580000,
  },
  {
    id: "withdraw-1",
    title: "Withdraw to External Wallet",
    icons: [<BtcIcon key="btc" className="size-7" />],
    keyValueRows: [
      { label: "Amount", value: "0.5 BTC" },
      { label: "To Address", value: "bc1q...x7f2" },
      { label: "Network Fee", value: "0.0001 BTC" },
      { label: "Confirmations", value: "2/6" },
    ],
    isSettled: false,
    createdAt: Date.now() - 30000,
  },
]

function ActivityDockProvider({ children }: { children: ReactNode }) {
  const [dockItems, setDockItems] = useState<DockItem[]>(FAKE_DOCK_ITEMS)

  const addDockItem = useCallback(
    (item: Omit<DockItem, "createdAt" | "settledAt">) => {
      setDockItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev
        return [...prev, { ...item, createdAt: Date.now() }]
      })
    },
    []
  )

  const updateDockItem = useCallback(
    (id: string, updates: Partial<Omit<DockItem, "id">>) => {
      setDockItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      )
    },
    []
  )

  const removeDockItem = useCallback(
    (id: string) =>
      setDockItems((prev) => prev.filter((item) => item.id !== id)),
    []
  )

  const settleDockItem = useCallback(
    (id: string) =>
      setDockItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, isSettled: true, settledAt: Date.now() }
            : item
        )
      ),
    []
  )

  const hasDockItem = useCallback(
    (id: string) => dockItems.some((item) => item.id === id),
    [dockItems]
  )

  const clearDockItems = useCallback(() => {
    setDockItems([])
  }, [])

  const value = useMemo(
    () => ({
      dockItems,
      addDockItem,
      updateDockItem,
      removeDockItem,
      settleDockItem,
      hasDockItem,
      clearDockItems,
    }),
    [
      dockItems,
      addDockItem,
      updateDockItem,
      removeDockItem,
      settleDockItem,
      hasDockItem,
      clearDockItems,
    ]
  )

  return (
    <ActivityDockContext.Provider value={value}>
      {children}
    </ActivityDockContext.Provider>
  )
}

export function useActivityDock() {
  const context = useContext(ActivityDockContext)

  if (!context) {
    throw new Error(
      "useActivityDock must be used within an ActivityDockProvider"
    )
  }

  return context
}

export default ActivityDockProvider
