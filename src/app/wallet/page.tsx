"use client"

import { Spinner } from "@radix-ui/themes"
import { formatUnits } from "ethers"
import React, { useEffect, useState } from "react"

import CardBalance from "@src/app/wallet/CardBalance"
import {
  nearTokenList,
  otherTokenList,
} from "@src/app/wallet/CardBalance/mocks"
import CardTokenList from "@src/app/wallet/CardTokenList"
import { LIST_NATIVE_TOKENS } from "@src/constants/tokens"
import { useAccountBalance } from "@src/hooks/useAccountBalance"
import { useTokensStore } from "@src/providers/TokensStoreProvider"
import type { NetworkTokenWithSwapRoute } from "@src/types/interfaces"

export interface EmptyTokenBalance {
  name: string
  symbol: string
  balance: string
  icon?: string
  balanceUsd?: string
  chainId?: string
}

export default function Wallet() {
  const { data, isLoading } = useTokensStore((state) => state)
  const [assetListWithBalances, setAssetListWithBalances] = useState<
    NetworkTokenWithSwapRoute[]
  >([])
  const { getAccountBalance } = useAccountBalance()

  const [balanceNear, setBalanceNear] = useState<string | undefined>()

  // biome-ignore lint/correctness/useExhaustiveDependencies: `getAccountBalance` is not a stable reference
  useEffect(() => {
    const tokenNearNative = LIST_NATIVE_TOKENS.find(
      (token) => token.defuse_asset_id === "near:mainnet:native"
    )
    ;(async () => {
      assert(tokenNearNative, "Token not found")

      const { balance } = await getAccountBalance()
      const formattedAmountOut = formatUnits(
        BigInt(balance),
        tokenNearNative.decimals as number
      )
      setBalanceNear(formattedAmountOut)
    })()

    if (!data.size) {
      return
    }

    const getAssetListWithBalances: NetworkTokenWithSwapRoute[] = []
    for (const value of data.values()) {
      if (value?.balance) {
        getAssetListWithBalances.push({
          ...value,
          balance: value?.balance,
        })
      }
    }

    setAssetListWithBalances(getAssetListWithBalances)
  }, [data])

  return (
    <div className="flex flex-col flex-1 mx-3 md:mx-6">
      <div className="w-full mx-auto max-w-[768px] mt-[24px] mb-[32px] md:mt-[64px] md:mb-[90px]">
        <h1 className="mb-8">Wallet</h1>
      </div>
      <div className="w-full mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-10 mb-[90px]">
        <div className="flex flex-col gap-8">
          <CardBalance
            label="NEAR balance (available)"
            balance={balanceNear?.substring(0, 12) ?? "0.00"}
          />
          {!isLoading ? (
            <div className="flex justify-center">
              <Spinner loading={!isLoading} size="3" />
            </div>
          ) : (
            <CardTokenList
              list={
                assetListWithBalances ? assetListWithBalances : nearTokenList
              }
            />
          )}
        </div>
        <div className="flex flex-col gap-8 blur-sm">
          <CardBalance label="Deposited balance" balance="Deposited balance" />
          <CardTokenList list={otherTokenList} />
        </div>
      </div>
    </div>
  )
}

function assert(condition: unknown, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg)
  }
}
