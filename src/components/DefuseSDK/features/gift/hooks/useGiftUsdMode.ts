import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { getTokenPrice } from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { useCallback, useEffect, useState } from "react"

interface UseGiftUsdModeParams {
  token: TokenInfo | null
  tokenAmount: string
  tokensUsdPriceData?: TokenUsdPriceData
  onAmountChange: (value: string) => void
}

export function useGiftUsdMode({
  token,
  tokenAmount,
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
      const tokenNum = Number.parseFloat(tokenAmount.replace(",", "."))
      if (!Number.isNaN(tokenNum) && tokenNum > 0) {
        const usdEquivalent = tokenNum * tokenPrice
        setUsdValue(usdEquivalent.toFixed(2).replace(/\.?0+$/, ""))
      } else {
        setUsdValue("")
      }
      setIsUsdMode(true)
    }
  }, [isUsdMode, tokenPrice, tokenAmount])

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

      const tokenAmountCalc = usdNum / tokenPrice
      const formattedAmount = tokenAmountCalc.toFixed(8).replace(/\.?0+$/, "")
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

  const setTokenAmount = useCallback(
    (newTokenAmount: string) => {
      onAmountChange(newTokenAmount)
      if (isUsdMode && tokenPrice && tokenPrice > 0) {
        const tokenNum = Number.parseFloat(newTokenAmount.replace(",", "."))
        if (!Number.isNaN(tokenNum) && tokenNum > 0) {
          const usdEquivalent = tokenNum * tokenPrice
          setUsdValue(usdEquivalent.toFixed(2).replace(/\.?0+$/, ""))
        } else {
          setUsdValue("")
        }
      }
    },
    [isUsdMode, tokenPrice, onAmountChange]
  )

  return {
    isUsdMode,
    usdValue,
    tokenPrice,
    handleToggle,
    handleUsdInputChange,
    setTokenAmount,
  }
}
