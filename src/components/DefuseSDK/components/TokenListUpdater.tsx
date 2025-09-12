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
import { isBaseToken, isUnifiedToken } from "../utils"

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

      function addToken(token: BaseTokenInfo | UnifiedTokenInfo) {
        newList.push(isBaseToken(token) ? token : token.groupedTokens[0])

        if (isUnifiedToken(token)) {
          return
        }

        if (
          isBaseToken(tokenIn)
            ? tokenIn.defuseAssetId === token.defuseAssetId
            : tokenIn.groupedTokens.some(
                (t) => t.defuseAssetId === token.defuseAssetId
              )
        ) {
          swapUIActorRef.send({ type: "input", params: { tokenIn: token } })
        }

        if (
          isBaseToken(tokenOut)
            ? tokenOut.defuseAssetId === token.defuseAssetId
            : tokenOut.groupedTokens.some(
                (t) => t.defuseAssetId === token.defuseAssetId
              )
        ) {
          swapUIActorRef.send({ type: "input", params: { tokenOut: token } })
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

      if (nonZeroBalanceTokensDeduped.length === 0) {
        // if user doesn't have this token use first from the list by default
        addToken(token)
      } else if (nonZeroBalanceTokensDeduped.length === 1) {
        // if user has this token use it
        addToken(nonZeroBalanceTokensDeduped[0])
      } else {
        // if user has multiple kinds of this token - show them all
        for (const t of [...nonZeroBalanceTokensDeduped].reverse()) {
          addToken({ ...t, symbol: `${t.symbol} (${t.chainName})` })
        }
      }
    }

    const {
      context: {
        formValues: { tokenIn: newTokenIn, tokenOut: newTokenOut },
      },
    } = swapUIActorRef.getSnapshot()

    const [tokenInSymbol] = newTokenIn.symbol.split(" ")
    const [tokenOutSymbol] = newTokenOut.symbol.split(" ")

    // set near if it happens that tokenIn and tokenOut are the same
    if (newTokenIn === newTokenOut) {
      swapUIActorRef.send({ type: "input", params: { tokenOut: NATIVE_NEAR } })
    } else if (tokenInSymbol === tokenOutSymbol) {
      // make sure network is displayed if it's the same symbol
      if (tokenInSymbol.length === newTokenIn.symbol.length) {
        swapUIActorRef.send({
          type: "input",
          params: {
            tokenIn: {
              ...newTokenIn,
              symbol: `${newTokenIn.symbol} (${isBaseToken(newTokenIn) ? newTokenIn.chainName : newTokenIn.groupedTokens[0].chainName})`,
            },
          },
        })
      }

      if (tokenOutSymbol.length === newTokenOut.symbol.length) {
        swapUIActorRef.send({
          type: "input",
          params: {
            tokenOut: {
              ...newTokenOut,
              symbol: `${newTokenOut.symbol} (${isBaseToken(newTokenOut) ? newTokenOut.chainName : newTokenOut.groupedTokens[0].chainName})`,
            },
          },
        })
      }
    }

    updateTokens(newList, true)
  }, [tokenList, allBalances, updateTokens, swapUIActorRef, flatListIsEnabled])

  return null
}
