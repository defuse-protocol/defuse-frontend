import { balanceAllSelector } from "@src/components/DefuseSDK/features/machines/depositedBalanceMachine"
import { SwapUIMachineContext } from "@src/components/DefuseSDK/features/swap/components/SwapUIMachineProvider"
import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"
import type { SwappableToken } from "@src/components/DefuseSDK/types/swap"
import { LIST_TOKENS, NATIVE_NEAR } from "@src/constants/tokens"
import { useSelector } from "@xstate/react"
import { useSearchParams } from "next/navigation"
import { useEffect, useMemo } from "react"
import { useTokensStore } from "../providers/TokensStoreProvider"
import { isBaseToken } from "../utils"

export function TokenListUpdater<
  T extends {
    tokenList: (BaseTokenInfo | UnifiedTokenInfo | SwappableToken)[]
  },
>({ tokenList }: { tokenList: T["tokenList"] }) {
  const { updateTokens } = useTokensStore((state) => state)

  useEffect(() => {
    updateTokens(tokenList)
  }, [tokenList, updateTokens])

  return null
}

export function TokenListUpdater1cs<
  T extends {
    tokenList: (BaseTokenInfo | UnifiedTokenInfo | SwappableToken)[]
  },
>(props: { tokenList: T["tokenList"] }) {
  const tokenList = useMemo(() => {
    const filteredList: BaseTokenInfo[] = props.tokenList.filter(
      (token): token is BaseTokenInfo => {
        return isBaseToken(token)
      }
    )

    if (filteredList.length < props.tokenList.length) {
      throw new Error("Flat token list is expected for 1cs")
    }

    return filteredList
  }, [props.tokenList])

  const swapUIActorRef = SwapUIMachineContext.useActorRef()
  const depositedBalanceRef = useSelector(
    swapUIActorRef,
    (state) => state.children.depositedBalanceRef
  )

  const { updateTokens } = useTokensStore((state) => state)

  const balancesSelector = useMemo(() => {
    return balanceAllSelector(
      Object.fromEntries(
        tokenList.flatMap((token) => [[token.defuseAssetId, token] as const])
      )
    )
  }, [tokenList])

  const allBalances = useSelector(depositedBalanceRef, balancesSelector)
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")

  useEffect(() => {
    if (flatListIsEnabled || allBalances === undefined) {
      updateTokens(tokenList)
      return
    }

    const newList: BaseTokenInfo[] = []
    const { tokenIn, tokenOut } =
      swapUIActorRef.getSnapshot().context.formValues

    for (const originalToken of tokenList) {
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

      const isTokenIn = isBaseToken(tokenIn)
        ? tokenIn.defuseAssetId === originalToken.defuseAssetId
        : tokenIn.unifiedAssetId === token.unifiedAssetId

      const isTokenOut = isBaseToken(tokenOut)
        ? tokenOut.defuseAssetId === originalToken.defuseAssetId
        : tokenOut.unifiedAssetId === token.unifiedAssetId

      function setTokenIn(tokenIn: BaseTokenInfo) {
        if (isTokenIn) {
          swapUIActorRef.send({ type: "input", params: { tokenIn } })
        }
      }

      function setTokenOut(tokenOut: BaseTokenInfo) {
        if (isTokenOut) {
          swapUIActorRef.send({ type: "input", params: { tokenOut } })
        }
      }

      const nonZeroBalanceTokens = token.groupedTokens.filter(
        (groupedToken) =>
          (allBalances[groupedToken.defuseAssetId]?.amount ?? 0n) !== 0n
      )

      const defuseAssetIds = new Set(
        nonZeroBalanceTokens.map((t) => t.defuseAssetId)
      )

      const nonZeroBalanceTokensDeduped = nonZeroBalanceTokens.filter((t) => {
        if (defuseAssetIds.has(t.defuseAssetId)) {
          defuseAssetIds.delete(t.defuseAssetId)
          return true
        }
        return false
      })

      // if user doesn't have this token use first from the list by default
      if (nonZeroBalanceTokensDeduped.length === 0) {
        const t = token.groupedTokens[0]
        newList.push(t)
        setTokenIn(t)
        setTokenOut(t)
        // if user has this token use it
      } else if (nonZeroBalanceTokensDeduped.length === 1) {
        const t = nonZeroBalanceTokensDeduped[0]
        newList.push(t)
        setTokenIn(t)
        setTokenOut(t)
        // if user has multiple kinds of this token - show them all
      } else {
        const tokensWithChain = nonZeroBalanceTokensDeduped.map((t) => ({
          ...t,
          symbol: `${token.symbol} (${t.chainName})`,
        }))

        let isTokenInSet = false
        let isTokenOutSet = false

        for (const t of tokensWithChain) {
          newList.push(t)
          if (t.symbol === tokenIn.symbol) {
            isTokenInSet = true
            setTokenIn(t)
          } else if (t.symbol === tokenOut.symbol) {
            isTokenOutSet = true
            setTokenOut(t)
          }
        }

        if (!isTokenInSet) {
          setTokenIn(tokensWithChain[0])
        }

        if (!isTokenOutSet) {
          setTokenOut(tokensWithChain[0])
        }
      }
    }

    const {
      context: {
        formValues: { tokenIn: newTokenIn, tokenOut: newTokenOut },
      },
    } = swapUIActorRef.getSnapshot()

    if (newTokenIn === newTokenOut) {
      swapUIActorRef.send({ type: "input", params: { tokenOut: NATIVE_NEAR } })
    }

    updateTokens(newList, true)
  }, [tokenList, allBalances, updateTokens, swapUIActorRef, flatListIsEnabled])

  return null
}
