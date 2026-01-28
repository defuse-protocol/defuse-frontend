"use client"

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
  icon: ReactNode
  explorerUrl?: string
  keyValueRows: KeyValueRow[]
  renderContent?: () => ReactNode
  rawIcon?: boolean
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
}

const ActivityDockContext = createContext<ActivityDockContextType | undefined>(
  undefined
)

// TODO: Remove fake data after testing
const FAKE_DOCK_ITEMS: DockItem[] = [
  {
    id: "swap-1",
    title: "Swapping ETH → USDC",
    icon: "🔄",
    keyValueRows: [
      { label: "Amount", value: "0.5 ETH" },
      { label: "Estimated", value: "~1,250 USDC" },
      { label: "Status", value: "Pending..." },
    ],
    createdAt: Date.now() - 10_000, // 10 seconds ago
  },
  {
    id: "swap-2",
    title: "Swap Complete",
    icon: "✅",
    explorerUrl: "https://etherscan.io/tx/0x123",
    keyValueRows: [
      { label: "Received", value: "500 USDC" },
      { label: "From", value: "0.2 ETH" },
      { label: "Network", value: "Ethereum" },
    ],
    isSettled: true,
    createdAt: Date.now() - 120_000, // 2 minutes ago
    settledAt: Date.now() - 30_000, // settled 30 seconds ago
  },
  {
    id: "deposit-1",
    title: "Depositing NEAR",
    icon: "📥",
    keyValueRows: [
      { label: "Amount", value: "100 NEAR" },
      { label: "From", value: "near.wallet" },
    ],
    createdAt: Date.now() - 3_000, // 3 seconds ago (dismiss button hidden)
  },
  {
    id: "withdraw-1",
    title: "Withdrawing SOL",
    icon: "📤",
    keyValueRows: [
      { label: "Amount", value: "25 SOL" },
      { label: "To", value: "7xKXt...9Qm2" },
      { label: "Fee", value: "0.001 SOL" },
    ],
    createdAt: Date.now() - 45_000, // 45 seconds ago
  },
  {
    id: "bridge-1",
    title: "Bridge Failed",
    icon: "❌",
    explorerUrl: "https://arbiscan.io/tx/0x456",
    keyValueRows: [
      { label: "Route", value: "Arbitrum → Base" },
      { label: "Amount", value: "1,000 USDT" },
      { label: "Error", value: "Slippage exceeded" },
    ],
    isSettled: true,
    createdAt: Date.now() - 180_000, // 3 minutes ago
    settledAt: Date.now() - 15_000, // settled 15 seconds ago
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

  const value = useMemo(
    () => ({
      dockItems,
      addDockItem,
      updateDockItem,
      removeDockItem,
      settleDockItem,
      hasDockItem,
    }),
    [
      dockItems,
      addDockItem,
      updateDockItem,
      removeDockItem,
      settleDockItem,
      hasDockItem,
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
