"use client"

import {
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
    <div className="hidden md:block fixed bottom-0 left-0 m-5 z-10">
      <Link href={SYSTEM_STATUS_URL} target="_blank">
        <SystemStatus.StatusIndicator systemStatus={systemStatus} />
      </Link>
    </div>
  )
}

SystemStatus.Mobile = function Mobile() {
  const systemStatus = useSystemStatus()
  return (
    <div className="md:hidden">
      <Link href={SYSTEM_STATUS_URL} target="_blank">
        <SystemStatus.StatusIndicator systemStatus={systemStatus} />
      </Link>
    </div>
  )
}

SystemStatus.StatusIndicator = function StatusIndicator({
  systemStatus,
}: { systemStatus: SystemStatusType | null }) {
  if (systemStatus === null) {
    return null
  }

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 w-fit hover:bg-gray-800 dark:hover:bg-gray-800">
      <span
        className={`${
          systemStatus === "maintenance" ? "bg-yellow-400" : "bg-blue-400"
        } w-2 h-2 rounded-full`}
      />
      <span className="text-blue-400 text-sm whitespace-nowrap">
        {systemStatus === "maintenance"
          ? "Some systems might not work."
          : "All systems normal."}
      </span>
    </div>
  )
}
