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

interface UseUsdOutputModeParams {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  usdAmountOut: number | null
  tokensUsdPriceData?: TokenUsdPriceData
  setValue: UseFormSetValue<SwapFormValues>
  swapUIActorRef: ActorRefFrom<typeof swapUIMachine>
}

export function useUsdOutputMode({
  tokenIn,
  tokenOut,
  usdAmountOut,
  tokensUsdPriceData,
  setValue,
  swapUIActorRef,
}: UseUsdOutputModeParams) {
  const tokenOutPrice = getTokenPrice(tokenOut, tokensUsdPriceData)
  const [isUsdMode, setIsUsdMode] = useState(false)
  const [usdValue, setUsdValue] = useState("")

  const handleToggle = useCallback(() => {
    if (!tokenOutPrice || tokenOutPrice <= 0) return

    if (isUsdMode) {
      setIsUsdMode(false)
      setUsdValue("")
    } else {
      const currentUsd = usdAmountOut ?? 0
      setUsdValue(currentUsd > 0 ? currentUsd.toString() : "")
      setIsUsdMode(true)
    }
  }, [isUsdMode, usdAmountOut, tokenOutPrice])

  const handleInputChange = useCallback(
    (usdInputValue: string) => {
      setUsdValue(usdInputValue)

      if (!tokenOutPrice || tokenOutPrice <= 0) return

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
            swapType: QuoteRequest.swapType.EXACT_OUTPUT,
            amountIn: "",
            amountOut: "",
          },
        })
        return
      }

      const tokenAmount = usdNum / tokenOutPrice
      const formattedAmount = tokenAmount.toFixed(8).replace(/\.?0+$/, "")

      setValue("amountOut", formattedAmount)
      setValue("amountIn", "")
      swapUIActorRef.send({
        type: "input",
        params: {
          tokenIn,
          tokenOut,
          swapType: QuoteRequest.swapType.EXACT_OUTPUT,
          amountOut: formattedAmount,
          amountIn: "",
        },
      })
    },
    [tokenOutPrice, tokenIn, tokenOut, setValue, swapUIActorRef]
  )

  const tokenOutId = getDefuseAssetId(tokenOut)
  // biome-ignore lint/correctness/useExhaustiveDependencies: reset when token changes
  useEffect(() => {
    setIsUsdMode(false)
    setUsdValue("")
  }, [tokenOutId])

  return {
    isUsdMode,
    usdValue,
    tokenOutPrice,
    handleToggle,
    handleInputChange,
  }
}
