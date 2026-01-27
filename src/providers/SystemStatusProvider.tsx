"use client"

import { createContext, useContext } from "react"

export type SystemPostType = {
  id: string
  status: "maintenance" | "incident"
  message: string
}
export type SystemStatusType = Array<SystemPostType>

// Use undefined as sentinel to distinguish "not in provider" from "status is null"
const SystemStatusContext = createContext<SystemPostType | null | undefined>(
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
  const status = getSystemStatusPriority(systemStatus)

  return (
    <SystemStatusContext.Provider value={status}>
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

// Prioritize incident over maintenance
export function getSystemStatusPriority(
  systemStatuses: SystemStatusType | null
) {
  if (!systemStatuses || systemStatuses.length === 0) return null

  const incident = systemStatuses.find((status) => status.status === "incident")

  if (incident) return incident

  const maintenance = systemStatuses.find(
    (status) => status.status === "maintenance"
  )

  return maintenance || null
}
