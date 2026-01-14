import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  getDefuseAssetId,
  isBaseToken,
  isUnifiedToken,
} from "@src/components/DefuseSDK/utils/token"
import { useCallback, useEffect, useState } from "react"
import type { UseFormSetValue } from "react-hook-form"
import type { ActorRefFrom } from "xstate"
import type { swapUIMachine } from "../../machines/swapUIMachine"
import type { SwapFormValues } from "../components/SwapForm"

function getTokenPrice(
  token: TokenInfo | null,
  priceData?: TokenUsdPriceData
): number | null {
  if (!priceData || !token) return null

  if (isBaseToken(token) && priceData[token.defuseAssetId]) {
    return priceData[token.defuseAssetId].price
  }

  if (isUnifiedToken(token)) {
    for (const grouped of token.groupedTokens) {
      if (isBaseToken(grouped) && priceData[grouped.defuseAssetId]) {
        return priceData[grouped.defuseAssetId].price
      }
    }
  }

  return null
}

interface UseUsdInputModeParams {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  usdAmountIn: number | null
  tokensUsdPriceData?: TokenUsdPriceData
  setValue: UseFormSetValue<SwapFormValues>
  swapUIActorRef: ActorRefFrom<typeof swapUIMachine>
}

export function useUsdInputMode({
  tokenIn,
  tokenOut,
  usdAmountIn,
  tokensUsdPriceData,
  setValue,
  swapUIActorRef,
}: UseUsdInputModeParams) {
  const tokenInPrice = getTokenPrice(tokenIn, tokensUsdPriceData)
  const [isUsdMode, setIsUsdMode] = useState(false)
  const [usdValue, setUsdValue] = useState("")

  const handleToggle = useCallback(() => {
    if (!tokenInPrice || tokenInPrice <= 0) return

    if (isUsdMode) {
      setIsUsdMode(false)
      setUsdValue("")
    } else {
      const currentUsd = usdAmountIn ?? 0
      setUsdValue(currentUsd > 0 ? currentUsd.toString() : "")
      setIsUsdMode(true)
    }
  }, [isUsdMode, usdAmountIn, tokenInPrice])

  const handleInputChange = useCallback(
    (usdInputValue: string) => {
      setUsdValue(usdInputValue)

      if (!tokenInPrice || tokenInPrice <= 0) return

      const usdNum = Number.parseFloat(usdInputValue.replace(",", "."))
      const isEmpty = Number.isNaN(usdNum) || usdNum <= 0

      if (isEmpty) {
        setValue("amountIn", "")
        setValue("amountOut", "")
        swapUIActorRef.send({
          type: "input",
          params: {
            tokenIn,
            tokenOut,
            swapType: QuoteRequest.swapType.EXACT_INPUT,
            amountIn: "",
            amountOut: "",
          },
        })
        return
      }

      const tokenAmount = usdNum / tokenInPrice
      const formattedAmount = tokenAmount.toFixed(8).replace(/\.?0+$/, "")

      setValue("amountIn", formattedAmount)
      setValue("amountOut", "")
      swapUIActorRef.send({
        type: "input",
        params: {
          tokenIn,
          tokenOut,
          swapType: QuoteRequest.swapType.EXACT_INPUT,
          amountIn: formattedAmount,
          amountOut: "",
        },
      })
    },
    [tokenInPrice, tokenIn, tokenOut, setValue, swapUIActorRef]
  )

  const tokenInId = getDefuseAssetId(tokenIn)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when token changes
  useEffect(() => {
    setIsUsdMode(false)
    setUsdValue("")
  }, [tokenInId])

  return {
    isUsdMode,
    usdValue,
    tokenInPrice,
    handleToggle,
    handleInputChange,
  }
}
