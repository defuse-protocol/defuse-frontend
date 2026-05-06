"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import type { Holding } from "@src/components/DefuseSDK/features/account/types/sharedTypes"
import { getTokenAid } from "@src/components/DefuseSDK/utils/token"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import Link from "next/link"
import { useCallback, useMemo, useState } from "react"

const LEGACY_BTC_NOTICE_DISMISSED_KEY = "legacy-btc-notice-dismissed"
const LEGACY_BTC_SWAP_LINK = `/?from=${encodeURIComponent("BTC (LEGACY)")}&to=BTC`

export function LegacyBtcNotice({
  holdings: holdingsProp,
  isHidden: isHiddenProp,
}: {
  holdings?: Holding[] | undefined
  isHidden?: boolean
}) {
  const { state } = useConnectWallet()
  const tokenList = useTokenList(LIST_TOKENS)
  const userAddress = (state.isVerified ? state.address : undefined) ?? null
  const userChainType = state.chainType ?? null
  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null
  const holdingsFromQuery = useWatchHoldings({ userId, tokenList })
  const holdings = holdingsProp ?? holdingsFromQuery
  const isHidden = isHiddenProp ?? userId == null

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

  const handleSwapClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault()
      window.location.assign(LEGACY_BTC_SWAP_LINK)
    },
    []
  )

  if (isHidden || !hasLegacyBtcHolding || isDismissed) {
    return null
  }

  return (
    <div className="widget-container mx-auto mt-5 md:mt-8 px-3 sm:px-0 md:-mb-4">
      <div className="flex items-start gap-2 rounded-2xl bg-gray-900 px-3 py-2.5 outline outline-white/5 dark:bg-gray-950">
        <ExclamationTriangleIcon className="mt-0.5 size-4 shrink-0 text-yellow-400" />
        <p className="min-w-0 flex-1 text-gray-400 text-sm font-medium">
          You have BTC (LEGACY). Swap it to BTC for better routing and support.{" "}
          <Link
            href={LEGACY_BTC_SWAP_LINK}
            className="font-semibold text-white underline underline-offset-2"
            onClick={handleSwapClick}
          >
            Swap to BTC
          </Link>
        </p>

        <button
          type="button"
          onClick={dismiss}
          className="-m-1 rounded-md p-1 text-gray-500 hover:bg-white/10 hover:text-gray-200"
        >
          <span className="sr-only">Dismiss</span>
          <Cross2Icon className="size-4" />
        </button>
      </div>
    </div>
  )
}
