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
  // Optional custom render content for swap tracking, etc.
  renderContent?: () => ReactNode
  // If true, render icon without the circle container
  rawIcon?: boolean
}

type ActivityDockContextType = {
  dockItems: DockItem[]
  addDockItem: (item: DockItem) => void
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
    () => ({ dockItems, addDockItem, removeDockItem, hasDockItem }),
    [dockItems, addDockItem, removeDockItem, hasDockItem]
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
