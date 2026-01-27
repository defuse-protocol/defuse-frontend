import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import {
  isBaseToken,
  isUnifiedToken,
} from "@src/components/DefuseSDK/utils/token"
import { useCallback, useEffect, useState } from "react"

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

interface UseGiftUsdModeParams {
  token: TokenInfo | null
  tokensUsdPriceData?: TokenUsdPriceData
  onAmountChange: (value: string) => void
}

export function useGiftUsdMode({
  token,
  tokensUsdPriceData,
  onAmountChange,
}: UseGiftUsdModeParams) {
  const tokenPrice = getTokenPrice(token, tokensUsdPriceData)
  const [isUsdMode, setIsUsdMode] = useState(false)
  const [usdValue, setUsdValue] = useState("")

  const handleToggle = useCallback(() => {
    if (!tokenPrice || tokenPrice <= 0) return

    if (isUsdMode) {
      setIsUsdMode(false)
      setUsdValue("")
    } else {
      setUsdValue("")
      setIsUsdMode(true)
    }
  }, [isUsdMode, tokenPrice])

  const handleUsdInputChange = useCallback(
    (usdInputValue: string) => {
      setUsdValue(usdInputValue)

      if (!tokenPrice || tokenPrice <= 0) return

      const usdNum = Number.parseFloat(usdInputValue.replace(",", "."))
      const isEmpty = Number.isNaN(usdNum) || usdNum <= 0

      if (isEmpty) {
        onAmountChange("")
        return
      }

      const tokenAmount = usdNum / tokenPrice
      const formattedAmount = tokenAmount.toFixed(8).replace(/\.?0+$/, "")
      onAmountChange(formattedAmount)
    },
    [tokenPrice, onAmountChange]
  )

  // Reset USD mode when token changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Effect intentionally triggers on token change
  useEffect(() => {
    setIsUsdMode(false)
    setUsdValue("")
  }, [token])

  const clearUsdValue = useCallback(() => {
    setUsdValue("")
  }, [])

  return {
    isUsdMode,
    usdValue,
    tokenPrice,
    handleToggle,
    handleUsdInputChange,
    clearUsdValue,
  }
}
