"use client"
import {
  balanceAllSelector,
  type depositedBalanceMachine,
} from "@src/components/DefuseSDK/features/machines/depositedBalanceMachine"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import { getUnderlyingBaseTokenInfos } from "@src/components/DefuseSDK/utils/tokenUtils"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { useSelector } from "@xstate/react"
import { useEffect, useMemo } from "react"
import type { ActorRefFromLogic } from "xstate"
import { useTokensStore } from "../providers/TokensStoreProvider"
import type { TokenInfo } from "../types/base"
import { isBaseToken } from "../utils"

export function TokenListUpdater<T extends { tokenList: TokenInfo[] }>({
  tokenList,
}: { tokenList: T["tokenList"] }) {
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
  tokenList: TokenInfo[]
  depositedBalanceRef:
    | ActorRefFromLogic<typeof depositedBalanceMachine>
    | undefined
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  sendTokenInOrOut?: ({
    tokenIn,
    tokenOut,
  }: { tokenIn?: TokenInfo; tokenOut?: TokenInfo }) => void
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
  const isFlatTokenListEnabled = useIsFlatTokenListEnabled()

  useEffect(() => {
    if (isFlatTokenListEnabled || allBalances === undefined) {
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

      const baseTokenInfos = getUnderlyingBaseTokenInfos(token, true)

      const nonZeroBalanceTokens = Object.values(
        baseTokenInfos.reduce<Record<string, BaseTokenInfo>>((acc, t) => {
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
        newList.push(baseTokenInfos[0])
      } else {
        // if user has multiple kinds of this token - show them all
        newList.push(...nonZeroBalanceTokens)
        const firstToken = nonZeroBalanceTokens[0]

        if (
          sendTokenInOrOut &&
          (isBaseToken(tokenIn)
            ? tokenIn.defuseAssetId === firstToken.defuseAssetId
            : tokenIn.groupedTokens.some(
                (t) => t.defuseAssetId === firstToken.defuseAssetId
              ))
        ) {
          sendTokenInOrOut({ tokenIn: firstToken })
        }

        if (
          sendTokenInOrOut &&
          (isBaseToken(tokenOut)
            ? tokenOut.defuseAssetId === firstToken.defuseAssetId
            : tokenOut.groupedTokens.some(
                (t) => t.defuseAssetId === firstToken.defuseAssetId
              ))
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
    isFlatTokenListEnabled,
    sendTokenInOrOut,
  ])

  return null
}
