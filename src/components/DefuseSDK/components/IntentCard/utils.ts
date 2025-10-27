import {
  oneClickStatuses,
  statusesToTrack,
} from "../../features/machines/oneClickStatusMachine"

export const EXPLORER_NEAR_INTENTS = "https://explorer.near-intents.org"

export type StatusDisplayInfo = {
  label: string
  color: "red" | "green" | undefined
  showSpinner: boolean
}

export function getStatusDisplayInfo(status: string | null): StatusDisplayInfo {
  if (!status) {
    return { label: "Pending...", color: undefined, showSpinner: true }
  }

  const displayStatus =
    status in oneClickStatuses
      ? oneClickStatuses[status as keyof typeof oneClickStatuses]
      : status

  const isTracking = Boolean(
    status && (statusesToTrack as Set<string>).has(status)
  )
  const isSuccess = status === "SUCCESS"
  const isFailed = status === "FAILED" || status === "REFUNDED"

  return {
    label: displayStatus,
    color: isFailed ? "red" : isSuccess ? "green" : undefined,
    showSpinner: isTracking,
  }
}

export function truncate(hash: string): string {
  return `${hash.slice(0, 5)}...${hash.slice(-5)}`
}
