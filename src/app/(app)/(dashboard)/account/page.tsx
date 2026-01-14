"use client"

import { authIdentity } from "@defuse-protocol/internal-utils"
import Button from "@src/components/Button"
import Assets from "@src/components/DefuseSDK/features/account/components/Assets"
import Balance from "@src/components/DefuseSDK/features/account/components/Balance"
import { useWatchHoldings } from "@src/components/DefuseSDK/features/account/hooks/useWatchHoldings"
import { computeTotalUsdValue } from "@src/components/DefuseSDK/features/account/utils/holdingsUtils"
import { getTokenId } from "@src/components/DefuseSDK/utils/token"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSwapHistory } from "@src/features/balance-history/lib/useBalanceHistory"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useTokenList } from "@src/hooks/useTokenList"
import { DepositIcon, SendIcon } from "@src/icons"
import { useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useRef } from "react"

export default function AccountPage() {
  const { state } = useConnectWallet()
  const queryClient = useQueryClient()
  let tokenList = useTokenList(LIST_TOKENS)

  const userAddress = state.isVerified ? state.address : undefined
  const userChainType = state.chainType ?? null

  const userId =
    userAddress != null && userChainType != null
      ? authIdentity.authHandleToIntentsUserId(userAddress, userChainType)
      : null

  tokenList = useMemo(() => {
    const map = new Map()
    for (const t of tokenList) {
      if (!map.has(getTokenId(t))) {
        map.set(getTokenId(t), t)
      }
    }
    return Array.from(map.values())
  }, [tokenList])

  const { data: historyData } = useSwapHistory(
    { accountId: userAddress ?? "", limit: 10 },
    { enabled: Boolean(userAddress), refetchInterval: 5000 }
  )

  const allTransactions = useMemo(
    () => historyData?.pages.flatMap((page) => page.data) ?? [],
    [historyData]
  )

  const pendingTransactions = useMemo(() => {
    const threeMinutesAgo = Date.now() - 3 * 60 * 1000

    return allTransactions.filter((tx) => {
      if (tx.status !== "PENDING" && tx.status !== "PROCESSING") return false
      const txTime = new Date(tx.timestamp).getTime()
      return txTime >= threeMinutesAgo
    })
  }, [allTransactions])

  const prevPendingCount = useRef(pendingTransactions.length)

  useEffect(() => {
    if (
      prevPendingCount.current > 0 &&
      pendingTransactions.length < prevPendingCount.current
    ) {
      queryClient.invalidateQueries({
        queryKey: ["intents_sdk.deposited_balance"],
      })
      queryClient.invalidateQueries({
        queryKey: ["intents_sdk.transit_balance"],
      })
    }
    prevPendingCount.current = pendingTransactions.length
  }, [pendingTransactions.length, queryClient])

  const {
    data: holdings,
    isPending,
    isError,
  } = useWatchHoldings({ userId, tokenList })
  const totalValueUsd = holdings ? computeTotalUsdValue(holdings) : undefined

  const assetsLoaded = !isPending && !isError && Boolean(holdings)
  const noAssets = assetsLoaded && holdings && holdings.length === 0

  return (
    <>
      <h1 className="sr-only">Account</h1>

      <Balance balance={totalValueUsd} />

      {!noAssets && (
        <section className="grid grid-cols-2 gap-2 mt-6">
          <Button href="/deposit" size="xl">
            <DepositIcon className="size-6 -mt-1.5" />
            Add funds
          </Button>

          <Button href="/send" size="xl">
            <SendIcon className="size-6" />
            Send
          </Button>
        </section>
      )}

      <Assets
        assets={holdings}
        isPending={isPending}
        isError={isError}
        pendingTransactions={pendingTransactions}
        tokenList={tokenList}
      />
    </>
  )
}
