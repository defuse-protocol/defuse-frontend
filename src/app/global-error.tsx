"use client"

import { ArrowClockwiseIcon, WarningIcon } from "@phosphor-icons/react"
import { logger } from "@src/utils/logger"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  useEffect(() => {
    logger.error(new Error("Global error", { cause: error }))
  }, [error])

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 text-gray-900">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div
            role="alert"
            aria-live="assertive"
            className="mx-auto w-full max-w-md"
          >
            <div className="px-6 py-8 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
                <WarningIcon weight="fill" className="size-6 text-gray-600" />
              </div>

              <h1 className="mb-3 text-xl font-semibold text-gray-900">
                Oops! Something went wrong
              </h1>
              <p className="mb-6 text-sm text-gray-600">
                Please try refreshing the page.
              </p>

              {error.digest && (
                <div className="mb-6 rounded-md bg-gray-50 px-3 py-2 text-left">
                  <div className="text-xs text-gray-500">
                    Error ID:{" "}
                    <code className="rounded-sm bg-gray-100 px-1 py-0.5 font-mono text-xs text-gray-700">
                      {error.digest}
                    </code>
                  </div>
                </div>
              )}

              <button
                type="button"
                className="font-bold my-2.5 px-4 py-1.5 border border-gray hover:bg-gray-a3 rounded-full cursor-pointer"
                onClick={() => window.location.reload()}
              >
                <div className="flex items-center justify-center gap-1">
                  <ArrowClockwiseIcon weight="bold" className="size-4" />
                  <span className="text-base font-medium">Refresh</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
