"use client"

import { ExternalLinkIcon } from "@radix-ui/react-icons"
import { Separator } from "@radix-ui/themes"
import {
  type SystemPostType,
  type SystemStatusType,
  useSystemStatus,
} from "@src/providers/SystemStatusProvider"
import Link from "next/link"

const SYSTEM_STATUS_URL = "https://status.near-intents.org/posts/dashboard"

export function SystemStatus() {
  return (
    <>
      <SystemStatus.Desktop />
      <SystemStatus.Mobile />
    </>
  )
}

SystemStatus.Desktop = function Desktop() {
  const systemStatus = useSystemStatus()
  return (
    <div className="hidden md:block fixed bottom-0 left-0 mx-3 my-6 z-10">
      <Link href={SYSTEM_STATUS_URL} target="_blank">
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-fit hover:bg-gray-a3 dark:hover:bg-gray-800 text-sm">
          <SystemStatus.StatusIndicator systemStatus={systemStatus} />
        </div>
      </Link>
    </div>
  )
}

SystemStatus.Mobile = function Mobile() {
  const systemStatus = useSystemStatus()
  return (
    <div className="md:hidden flex flex-col gap-4">
      <Separator orientation="horizontal" size="4" />
      <Link href={SYSTEM_STATUS_URL} target="_blank">
        <div className="text-xs">
          <SystemStatus.StatusIndicator
            systemStatus={systemStatus}
            mobile={true}
          />
        </div>
      </Link>
    </div>
  )
}

SystemStatus.StatusIndicator = function StatusIndicator({
  systemStatus,
  mobile = false,
}: { systemStatus: SystemStatusType; mobile?: boolean }) {
  const prioritySystemStatus = getSystemStatusPriority(systemStatus)

  if (!prioritySystemStatus) {
    return null
  }

  if (mobile) {
    return (
      <div className="flex items-center justify-between gap-2">
        {renderStatusIcon(prioritySystemStatus)}
        {renderStatusText(prioritySystemStatus)}
        <ExternalLinkIcon width={16} height={16} />
      </div>
    )
  }

  return (
    <span className="flex items-center gap-2">
      {renderStatusIcon(prioritySystemStatus)}
      {renderStatusText(prioritySystemStatus)}
    </span>
  )
}

function renderStatusIcon(systemStatus: SystemPostType) {
  if (systemStatus.status === "maintenance") {
    return <span className="bg-yellow-400 w-2 h-2 rounded-full" />
  }
  if (systemStatus.status === "incident") {
    return <span className="bg-red-500 w-2 h-2 rounded-full" />
  }
  return <span className="bg-blue-400 w-2 h-2 rounded-full" />
}

function renderStatusText(systemStatus: SystemPostType) {
  if (systemStatus.status === "maintenance") {
    return <span className="text-blue-400">Maintenance in progress</span>
  }
  if (systemStatus.status === "incident") {
    return <span className="text-red-9">Incident detected</span>
  }
  return <span className="text-blue-400">All systems operational</span>
}

// Prioritize incident over maintenance
export function getSystemStatusPriority(systemStatus: SystemStatusType) {
  const incident = systemStatus.find((status) => status.status === "incident")
  if (incident) return incident

  const maintenance = systemStatus.find(
    (status) => status.status === "maintenance"
  )
  return maintenance || null
}
