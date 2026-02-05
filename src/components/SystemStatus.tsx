"use client"

import { useSystemStatus } from "@src/providers/SystemStatusProvider"
import clsx from "clsx"

const SYSTEM_STATUS_URL = "https://status.near-intents.org/posts/dashboard"

type Props = {
  className?: string
  showOperationalStatus?: boolean
}

function SystemStatus({ className, showOperationalStatus = false }: Props) {
  const status = useSystemStatus()

  if (!status && !showOperationalStatus) return null

  const statusType = status?.status ?? null

  let text = "All systems operational"

  if (statusType === "maintenance") {
    text = "Maintenance in progress"
  }

  if (statusType === "incident") {
    text = "Incident detected"
  }

  return (
    <div
      className={clsx(
        "flex items-center justify-center gap-3 px-3 py-2 rounded-xl",
        {
          "bg-red-50": statusType === "incident",
          "bg-yellow-100": statusType === "maintenance",
          "bg-blue-100": !statusType,
        },
        className
      )}
    >
      <span className="relative flex size-2.5 shrink-0">
        {statusType === "incident" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-red-500" />
        )}
        <span
          className={clsx("relative inline-flex size-2.5 rounded-full", {
            "bg-yellow-500": statusType === "maintenance",
            "bg-red-500": statusType === "incident",
            "bg-blue-500": !statusType,
          })}
        />
      </span>

      <p
        className={clsx("text-sm", {
          "text-yellow-800": statusType === "maintenance",
          "text-red-700": statusType === "incident",
          "text-blue-700": !statusType,
        })}
      >
        <span className="font-semibold">{text}</span>
        <a
          href={SYSTEM_STATUS_URL}
          target="_blank"
          rel="noreferrer noopener"
          className="font-medium underline ml-3"
        >
          View status
        </a>
      </p>
    </div>
  )
}

export default SystemStatus
