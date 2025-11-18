"use client"

import { ExternalLinkIcon } from "@radix-ui/react-icons"
import { Separator } from "@radix-ui/themes"
import {
  type SystemStatusType,
  useSystemStatus,
} from "@src/providers/SystemStatusProvider"
import { cn } from "@src/utils/cn"
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
    <div className="hidden md:block fixed bottom-0 left-10 m-5 z-10">
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
}: { systemStatus: SystemStatusType | null; mobile?: boolean }) {
  if (systemStatus === null) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          systemStatus === "maintenance" ? "bg-yellow-400" : "bg-blue-400",
          systemStatus === "incident" && "bg-red-400",
          "w-2 h-2 rounded-full"
        )}
      />
      <span
        className={cn(
          systemStatus === "incident" ? "text-red-9" : "text-blue-400"
        )}
      >
        {renderStatusText(systemStatus, mobile)}
      </span>
      {mobile && <ExternalLinkIcon width={16} height={16} />}
    </div>
  )
}

function renderStatusText(systemStatus: SystemStatusType, mobile: boolean) {
  if (systemStatus === "maintenance") {
    return mobile
      ? "Maintenance in progress"
      : "Maintenance in progress — some features may not work."
  }
  if (systemStatus === "incident") {
    return mobile
      ? "Active incident"
      : "Active incident — deposits and withdrawals may not work."
  }
  return "All systems operational."
}
