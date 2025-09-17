import {
  balanceAllSelector,
  type depositedBalanceMachine,
} from "@src/components/DefuseSDK/features/machines/depositedBalanceMachine"
import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"
import type { SwappableToken } from "@src/components/DefuseSDK/types/swap"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSelector } from "@xstate/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import type { ActorRefFromLogic } from "xstate"
import { useTokensStore } from "../providers/TokensStoreProvider"
import { isBaseToken } from "../utils"

export function TokenListUpdater<
  T extends {
    tokenList: (BaseTokenInfo | UnifiedTokenInfo | SwappableToken)[]
  },
>({ tokenList }: { tokenList: T["tokenList"] }) {
  const updateTokens = useTokensStore((state) => state.updateTokens)

  useEffect(() => {
    updateTokens(tokenList)
  }, [tokenList, updateTokens])

  return null
}

export function TokenListUpdater1cs({
  tokenList,
  depositedBalanceRef,
  tokenIn,
  tokenOut,
  sendTokenInOrOut,
}: {
  tokenList: (BaseTokenInfo | UnifiedTokenInfo | SwappableToken)[]
  depositedBalanceRef:
    | ActorRefFromLogic<typeof depositedBalanceMachine>
    | undefined
  tokenIn: SwappableToken
  tokenOut: SwappableToken
  sendTokenInOrOut: ({
    tokenIn,
    tokenOut,
  }: { tokenIn?: SwappableToken; tokenOut?: SwappableToken }) => void
}) {
  const tokens = useMemo(() => {
    const filteredList: BaseTokenInfo[] = tokenList.filter(
      (token): token is BaseTokenInfo => {
        return isBaseToken(token)
      }
    )

    if (filteredList.length < tokenList.length) {
      throw new Error("Flat token list is expected for 1cs")
    }

    return filteredList
  }, [tokenList])

  const updateTokens = useTokensStore((state) => state.updateTokens)

  const balancesSelector = useMemo(() => {
    return balanceAllSelector(
      Object.fromEntries(
        tokens.flatMap((token) => [[token.defuseAssetId, token] as const])
      )
    )
  }, [tokens])

  const allBalances = useSelector(depositedBalanceRef, balancesSelector)
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")

  useEffect(() => {
    if (flatListIsEnabled || allBalances === undefined) {
      updateTokens(tokens)
      return
    }

    const newList: BaseTokenInfo[] = []

    for (const originalToken of tokens) {
      const token = LIST_TOKENS.find((t) =>
        isBaseToken(t)
          ? t.defuseAssetId === originalToken.defuseAssetId
          : t.groupedTokens.some(
              (t) => t.defuseAssetId === originalToken.defuseAssetId
            )
      )

      if (token === undefined) {
        continue
      }

      if (isBaseToken(token)) {
        newList.push(token)
        continue
      }

      const nonZeroBalanceTokens = Object.values(
        token.groupedTokens.reduce<Record<string, BaseTokenInfo>>((acc, t) => {
          if (t.defuseAssetId in acc) {
            return acc
          }

          if ((allBalances[t.defuseAssetId]?.amount ?? 0n) !== 0n) {
            acc[t.defuseAssetId] = t
          }

          return acc
        }, {})
      )

      if (nonZeroBalanceTokens.length === 0) {
        // if user doesn't have this token add the first from the list by default
        newList.push(token.groupedTokens[0])
      } else {
        // if user has multiple kinds of this token - show them all
        newList.push(...nonZeroBalanceTokens)
        const firstToken = nonZeroBalanceTokens[0]

        if (
          isBaseToken(tokenIn)
            ? tokenIn.defuseAssetId === firstToken.defuseAssetId
            : tokenIn.groupedTokens.some(
                (t) => t.defuseAssetId === firstToken.defuseAssetId
              )
        ) {
          sendTokenInOrOut({ tokenIn: firstToken })
        }

        if (
          isBaseToken(tokenOut)
            ? tokenOut.defuseAssetId === firstToken.defuseAssetId
            : tokenOut.groupedTokens.some(
                (t) => t.defuseAssetId === firstToken.defuseAssetId
              )
        ) {
          sendTokenInOrOut({ tokenOut: firstToken })
        }
      }
    }

    updateTokens(newList)
  }, [
    tokens,
    allBalances,
    updateTokens,
    tokenIn,
    tokenOut,
    flatListIsEnabled,
    sendTokenInOrOut,
  ])

  return null
}
