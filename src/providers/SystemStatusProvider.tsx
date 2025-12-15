"use client"

import { createContext, useContext } from "react"

export type SystemPostType = {
  id: string
  status: "maintenance" | "incident"
  message: string
}
export type SystemStatusType = Array<SystemPostType>

// Use undefined as sentinel to distinguish "not in provider" from "status is null"
const SystemStatusContext = createContext<SystemStatusType | null | undefined>(
  undefined
)

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
  if (context === undefined) {
    throw new Error(
      "useSystemStatus must be used within a SystemStatusProvider"
    )
  }
  return context
}
