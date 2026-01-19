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

export type DockItemBase = {
  id: string
  title: string
  icon: ReactNode
  explorerUrl?: string
}

export type StaticDockItem = DockItemBase & {
  type?: "static"
  keyValueRows: KeyValueRow[]
}

export type CustomDockItem = DockItemBase & {
  type: "custom"
  /** Custom content renderer - receives `updateItem` to update title/icon/explorerUrl */
  renderContent: (
    updateItem: (updates: Partial<DockItemBase>) => void
  ) => ReactNode
}

export type DockItem = StaticDockItem | CustomDockItem

type ActivityDockContextType = {
  dockItems: DockItem[]
  addDockItem: (item: DockItem) => void
  updateDockItem: (id: string, updates: Partial<DockItemBase>) => void
  removeDockItem: (id: string) => void
  hasDockItem: (id: string) => boolean
}

const ActivityDockContext = createContext<ActivityDockContextType | undefined>(
  undefined
)

function ActivityDockProvider({ children }: { children: ReactNode }) {
  const [dockItems, setDockItems] = useState<DockItem[]>([])

  const addDockItem = useCallback((item: DockItem) => {
    setDockItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev
      return [...prev, item]
    })
  }, [])

  const updateDockItem = useCallback(
    (id: string, updates: Partial<DockItemBase>) => {
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
      hasDockItem,
    }),
    [dockItems, addDockItem, updateDockItem, removeDockItem, hasDockItem]
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
