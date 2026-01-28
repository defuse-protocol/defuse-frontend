"use client"

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/16/solid"
import { useSystemStatus } from "@src/providers/SystemStatusProvider"
import { APP_NETWORK_OUTAGE_NOTIFICATION } from "@src/utils/environment"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import type React from "react"

const STORAGE_KEY = "outage-notification-dismissed"

const NetworkOutageNotification: React.FC = () => {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(true)
  const systemStatus = useSystemStatus()

  // Only show on deposit, send and swap pages
  // TODO: Remove unused /withdraw (now called /send)
  const shouldShowNotification = [
    "/account",
    "/deposit",
    "/withdraw",
    "/swap",
    "/send",
  ].includes(pathname)

  useEffect(() => {
    // Check if notification was previously dismissed in this session
    const wasDismissed = sessionStorage.getItem(STORAGE_KEY) === "true"
    if (wasDismissed) {
      setIsVisible(false)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    sessionStorage.setItem(STORAGE_KEY, "true")
  }

  const messageNotification =
    systemStatus?.message ?? APP_NETWORK_OUTAGE_NOTIFICATION

  if (!isVisible || !shouldShowNotification || !messageNotification) {
    return null
  }

  return (
    <div className="bg-yellow-200 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl">
      <div className="flex items-start justify-center gap-3 flex-1">
        <ExclamationTriangleIcon className="mt-px size-5 shrink-0 text-yellow-800" />
        <span className="text-yellow-800 text-sm font-semibold line-clamp-2">
          {messageNotification}
        </span>
      </div>

      <button
        type="button"
        onClick={handleClose}
        className="-m-2 flex-none p-2 focus-visible:-outline-offset-4 text-yellow-800 hover:text-yellow-900 hover:bg-yellow-950/10 rounded-lg"
      >
        <span className="sr-only">Dismiss</span>
        <XMarkIcon aria-hidden="true" className="size-5" />
      </button>
    </div>
  )
}

export default NetworkOutageNotification
