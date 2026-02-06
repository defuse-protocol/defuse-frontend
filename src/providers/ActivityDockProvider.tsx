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

function ActivityDockProvider({ children }: { children: ReactNode }) {
  const [dockItems, setDockItems] = useState<DockItem[]>([])

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
