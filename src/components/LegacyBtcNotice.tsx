"use client"

import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import type { Holding } from "@src/components/DefuseSDK/features/account/types/sharedTypes"
import { getTokenAid } from "@src/components/DefuseSDK/utils/token"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

const LEGACY_BTC_NOTICE_DISMISSED_KEY = "legacy-btc-notice-dismissed"
const LEGACY_BTC_SWAP_LINK = `/?from=${encodeURIComponent("BTC (LEGACY)")}&to=BTC`

export function LegacyBtcNotice({
  holdings,
  isHidden,
}: {
  holdings: Holding[] | undefined
  isHidden: boolean
}) {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false
    return sessionStorage.getItem(LEGACY_BTC_NOTICE_DISMISSED_KEY) === "true"
  })

  const hasLegacyBtcHolding = useMemo(
    () =>
      (holdings ?? []).some(
        (holding) =>
          getTokenAid(holding.token) === "btc-legacy" &&
          (holding.value?.amount ?? 0n) > 0n
      ),
    [holdings]
  )

  const dismiss = useCallback(() => {
    setIsDismissed(true)
    sessionStorage.setItem(LEGACY_BTC_NOTICE_DISMISSED_KEY, "true")
  }, [])

  if (isHidden || !hasLegacyBtcHolding || isDismissed) {
    return null
  }

  return (
    <div className="mb-3 flex items-center gap-3 rounded-xl bg-yellow-100 px-3 py-2 outline outline-yellow-200 dark:bg-yellow-500/20 dark:outline-yellow-500/30">
      <div className="flex flex-1 items-start gap-3">
        <ExclamationTriangleIcon className="mt-px size-5 shrink-0 text-yellow-500 dark:text-yellow-400" />
        <p className="line-clamp-2 font-semibold text-sm text-yellow-800 dark:text-yellow-300">
          You have BTC (LEGACY). Swap it to BTC for better routing and support.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Link
          href={LEGACY_BTC_SWAP_LINK}
          className="whitespace-nowrap rounded-lg px-2 py-1 font-semibold text-sm text-yellow-900 underline underline-offset-2 hover:bg-yellow-950/10 dark:text-yellow-200 dark:hover:bg-yellow-500/20"
        >
          Swap to BTC
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="-m-2 rounded-lg p-1.5 text-yellow-800 hover:bg-yellow-950/10 hover:text-yellow-900 dark:text-yellow-300 dark:hover:bg-yellow-500/20 dark:hover:text-yellow-200"
        >
          <span className="sr-only">Dismiss</span>
          <Cross2Icon className="size-5" />
        </button>
      </div>
    </div>
  )
}
