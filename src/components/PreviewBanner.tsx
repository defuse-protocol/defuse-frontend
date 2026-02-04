"use client"

import { ExclamationTriangleIcon, XMarkIcon } from "@heroicons/react/16/solid"
import clsx from "clsx"
import { useEffect, useState } from "react"

const STORAGE_KEY = "preview-warning-dismissed"

const PreviewBanner = ({ className }: { className?: string }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if notification was previously dismissed in this session
    const wasDismissed = localStorage.getItem(STORAGE_KEY) === "true"
    if (!wasDismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem(STORAGE_KEY, "true")
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={clsx(
        "bg-yellow-100 flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl",
        className
      )}
    >
      <div className="flex items-start justify-center gap-3 flex-1">
        <ExclamationTriangleIcon className="mt-px size-5 shrink-0 text-yellow-500" />
        <span className="text-yellow-800 text-sm font-semibold line-clamp-2">
          Preview for testing only. There may be bugs. Do not deposit funds you
          can not afford to lose.
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

export default PreviewBanner
