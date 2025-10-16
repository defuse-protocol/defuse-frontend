"use client"

import {
  ArrowClockwiseIcon,
  ClipboardTextIcon,
  WarningIcon,
} from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { logger } from "@src/utils/logger"
import { useEffect, useState } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    logger.error(new Error("Global error", { cause: error }))
  }, [error])

  const copyDigest = async () => {
    if (!error.digest) return
    try {
      await navigator.clipboard.writeText(error.digest)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // no-op
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white dark:bg-black text-black dark:text-white">
        <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div
            role="alert"
            aria-live="assertive"
            className="mx-auto w-full max-w-lg rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl ring-1 ring-black/5"
          >
            <div className="px-6 py-7 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-4/60">
                <WarningIcon weight="fill" className="size-8 text-red-11" />
              </div>

              <h1 className="mb-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white">
                Something went wrong
              </h1>
              <p className="mx-auto max-w-md text-sm text-gray-600 dark:text-gray-300">
                An unexpected error occurred. We apologize for the
                inconvenience. Please try refreshing the page.
              </p>

              {error.digest && (
                <div className="mt-6 inline-flex w-full items-center justify-between gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-left">
                  <div className="truncate text-xs text-gray-600 dark:text-gray-300">
                    Error ID:{" "}
                    <code className="rounded bg-gray-200 dark:bg-gray-600 px-1 py-0.5 font-mono text-[11px] text-gray-800 dark:text-gray-200">
                      {error.digest}
                    </code>
                  </div>
                  <Button
                    size="2"
                    variant="soft"
                    color="gray"
                    onClick={copyDigest}
                    className="ml-2 shrink-0"
                  >
                    {copied ? "Copied" : "Copy"}{" "}
                    <ClipboardTextIcon className="ml-1 size-4" />
                  </Button>
                </div>
              )}

              <div className="flex flex-col md:flex-row justify-center gap-3 mt-5">
                <Button
                  type="button"
                  size="3"
                  className="w-full font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                  onClick={() => {
                    window.location.reload()
                  }}
                >
                  Try again{" "}
                  <ArrowClockwiseIcon weight="bold" className="ml-2 size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
