"use client"

import { createContext, useContext } from "react"

export type SystemStatusType = "idle" | "maintenance"

const SystemStatusContext = createContext<SystemStatusType | null>(null)

type ProviderProps = {
  children: React.ReactNode
  systemStatus: SystemStatusType | null
}

export function SystemStatusProvider({
  children,
  systemStatus,
}: ProviderProps) {
  return (
    <SystemStatusContext.Provider value={systemStatus}>
      {children}
    </SystemStatusContext.Provider>
  )
}

export function useSystemStatus() {
  const context = useContext(SystemStatusContext)
  if (!context) {
    throw new Error(
      "useSystemStatus must be used within a SystemStatusProvider"
    )
  }
  return context
}
