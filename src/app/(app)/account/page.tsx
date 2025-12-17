"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import Assets from "@src/components/DefuseSDK/features/account/components/Assets"
import Balance from "@src/components/DefuseSDK/features/account/components/Balance"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import { computeTotalUsdValue } from "@src/components/DefuseSDK/features/account/utils/holdingsUtils"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { DepositIcon, SendIcon } from "@src/icons"
import Link from "next/link"
import { useMemo } from "react"

export default function AccountPage() {
  const { state } = useConnectWallet()
  let tokenList = useTokenList(LIST_TOKENS)

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType ?? null

  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

  // This case for `flatTokenList=1`, where we combine all tokens into one list.
  // So there might be tokens with the same `defuseAssetId`, so we need to remove them.
  // Otherwise, we'll end up showing the same token multiple times.
  tokenList = useMemo(() => {
    const map = new Map()
    for (const t of tokenList) {
      if (!map.has(getTokenId(t))) {
        map.set(getTokenId(t), t)
      }
    }
    return Array.from(map.values())
  }, [tokenList])

  const holdings = useWatchHoldings({ userId, tokenList })
  const totalValueUsd = holdings ? computeTotalUsdValue(holdings) : undefined

  return (
    <>
      <h1 className="sr-only">Account</h1>

      <Balance balance={totalValueUsd} />

      <section className="grid grid-cols-2 gap-2 mt-6">
        <Link
          href="/deposit"
          className="h-13 flex items-center justify-center rounded-2xl bg-gray-900 text-white text-base font-semibold tracking-tight gap-2"
        >
          <DepositIcon className="size-6 -mt-1.5" />
          Add funds
        </Link>
        <Link
          href="/send"
          className="h-13 flex items-center justify-center rounded-2xl bg-gray-900 text-white text-base font-semibold tracking-tight gap-2"
        >
          <SendIcon className="size-6" />
          Send
        </Link>
      </section>

      <Assets assets={holdings} />
    </>
  )
}
