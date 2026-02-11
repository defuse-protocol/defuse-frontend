"use client"

import { ShieldIcon } from "@phosphor-icons/react"
import { Button } from "@radix-ui/themes"
import { getPrivateBalance } from "@src/components/DefuseSDK/features/machines/privateIntents"
import { usePrivateModeStore } from "@src/stores/usePrivateModeStore"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"
import { Island } from "../../../components/Island"
import { useTokensUsdPrices } from "../../../hooks/useTokensUsdPrices"
import type { BaseTokenInfo, TokenInfo } from "../../../types/base"
import { formatTokenValue } from "../../../utils/format"
import getTokenUsdPrice from "../../../utils/getTokenUsdPrice"
import { getTokenId, isBaseToken, isUnifiedToken } from "../../../utils/token"
import type { Holding } from "../types/sharedTypes"
import { HoldingItemSkeleton } from "./shared/HoldingItem"
import { PrivateHoldingItem } from "./shared/PrivateHoldingItem"

interface PrivateHoldingsIslandProps {
  tokenList: TokenInfo[]
  isLoggedIn: boolean
}

export function PrivateHoldingsIsland({
  tokenList,
  isLoggedIn,
}: PrivateHoldingsIslandProps) {
  const isPrivateModeEnabled = usePrivateModeStore(
    (state) => state.isPrivateModeEnabled
  )

  // Don't render if private mode is not enabled
  if (!isPrivateModeEnabled) {
    return null
  }

  return (
    <Island className="py-4">
      <div className="flex items-center gap-2 px-1 pb-2 border-b border-gray-a3 mb-2">
        <ShieldIcon className="w-4 h-4 text-gray-11" weight="fill" />
        <span className="text-sm font-bold text-gray-11">Private Balance</span>
      </div>
      <Content tokenList={tokenList} isLoggedIn={isLoggedIn} />
    </Island>
  )
}

function Content({
  tokenList,
  isLoggedIn,
}: {
  tokenList: TokenInfo[]
  isLoggedIn: boolean
}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["private-balance"],
    queryFn: async () => {
      const result = await getPrivateBalance()
      if ("err" in result) {
        throw new Error(result.err)
      }
      return result.ok
    },
    refetchInterval: 15000, // Refetch every 15 seconds
    enabled: isLoggedIn,
  })

  const { data: usdPrices } = useTokensUsdPrices()

  // Convert private balances to Holdings format
  const privateHoldings: Holding[] = useMemo(() => {
    if (!data?.balances) return []

    const holdings: Holding[] = []

    for (const entry of data.balances) {
      const balanceBigInt = BigInt(entry.available)
      if (balanceBigInt <= 0n) continue

      // Find token in token list (check both base tokens and grouped tokens inside unified tokens)
      let token: BaseTokenInfo | undefined
      for (const t of tokenList) {
        if (isBaseToken(t) && t.defuseAssetId === entry.tokenId) {
          token = t
          break
        }
        if (isUnifiedToken(t)) {
          const grouped = t.groupedTokens.find(
            (gt) => gt.defuseAssetId === entry.tokenId
          )
          if (grouped) {
            token = grouped
            break
          }
        }
      }

      if (token) {
        const value = {
          amount: balanceBigInt,
          decimals: token.decimals,
        }

        // Calculate USD value
        const usdValue =
          getTokenUsdPrice(
            formatTokenValue(value.amount, value.decimals),
            token,
            usdPrices
          ) ?? undefined

        holdings.push({
          token,
          value,
          usdValue,
          transitValue: undefined,
          transitUsdValue: undefined,
        })
      }
    }

    // Sort by USD value (descending), fallback to balance
    return holdings.sort((a, b) => {
      if (a.usdValue != null && b.usdValue != null) {
        return b.usdValue - a.usdValue
      }
      if (!a.value || !b.value) return 0
      return b.value.amount > a.value.amount ? 1 : -1
    })
  }, [data, tokenList, usdPrices])

  if (!isLoggedIn) {
    return <EmptyScreen message="Connect wallet to view private balance" />
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-2">
        <div className="text-sm text-red-500">
          Failed to load private balance
        </div>
        <Button size="1" variant="soft" onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    )
  }

  if (privateHoldings.length === 0) {
    return <EmptyScreen message="No private assets yet" />
  }

  return privateHoldings.map((holding) => (
    <PrivateHoldingItem key={getTokenId(holding.token)} holding={holding} />
  ))
}

function EmptyScreen({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <ShieldIcon weight="bold" className="size-6 mb-2 text-gray-10" />
      <div className="text-xs font-medium text-gray-11">{message}</div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <>
      <HoldingItemSkeleton />
      <HoldingItemSkeleton />
    </>
  )
}
