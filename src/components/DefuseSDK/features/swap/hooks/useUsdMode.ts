import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { getTokenPrice } from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { useCallback, useEffect, useState } from "react"
import type { UseFormSetValue } from "react-hook-form"
import type { ActorRefFrom } from "xstate"
import type { swapUIMachine } from "../../machines/swapUIMachine"
import type { SwapFormValues } from "../components/SwapForm"

type UsdModeDirection = "input" | "output"

interface UseUsdModeParams {
  direction: UsdModeDirection
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  tokensUsdPriceData?: TokenUsdPriceData
  setValue: UseFormSetValue<SwapFormValues>
  swapUIActorRef: ActorRefFrom<typeof swapUIMachine>
}

export function useUsdMode({
  direction,
  tokenIn,
  tokenOut,
  tokensUsdPriceData,
  setValue,
  swapUIActorRef,
}: UseUsdModeParams) {
  const isInput = direction === "input"
  const token = isInput ? tokenIn : tokenOut
  const tokenPrice = getTokenPrice(token, tokensUsdPriceData)
  const [isUsdMode, setIsUsdMode] = useState(false)
  const [usdValue, setUsdValue] = useState("")

  const swapType = isInput
    ? QuoteRequest.swapType.EXACT_INPUT
    : QuoteRequest.swapType.EXACT_OUTPUT

  const handleToggle = useCallback(() => {
    if (!tokenPrice || tokenPrice <= 0) return

    if (isUsdMode) {
      setIsUsdMode(false)
      setUsdValue("")
    } else {
      // Don't prefill - let the calculated USD from quote show through
      setUsdValue("")
      setIsUsdMode(true)
    }
  }, [isUsdMode, tokenPrice])

  const handleInputChange = useCallback(
    (usdInputValue: string) => {
      setUsdValue(usdInputValue)

      if (!tokenPrice || tokenPrice <= 0) return

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
            swapType,
            amountIn: "",
            amountOut: "",
          },
        })
        return
      }

      const tokenAmount = usdNum / tokenPrice
      const formattedAmount = tokenAmount.toFixed(8).replace(/\.?0+$/, "")

      if (isInput) {
        setValue("amountIn", formattedAmount)
        setValue("amountOut", "")
        swapUIActorRef.send({
          type: "input",
          params: {
            tokenIn,
            tokenOut,
            swapType,
            amountIn: formattedAmount,
            amountOut: "",
          },
        })
      } else {
        setValue("amountOut", formattedAmount)
        setValue("amountIn", "")
        swapUIActorRef.send({
          type: "input",
          params: {
            tokenIn,
            tokenOut,
            swapType,
            amountOut: formattedAmount,
            amountIn: "",
          },
        })
      }
    },
    [tokenPrice, tokenIn, tokenOut, setValue, swapUIActorRef, swapType, isInput]
  )

  // Reset USD mode when the relevant token changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: Effect intentionally triggers on token change, not on using the value
  useEffect(() => {
    setIsUsdMode(false)
    setUsdValue("")
  }, [isInput ? tokenIn : tokenOut])

  // Clear the user-entered value so calculated value shows through
  const clearUsdValue = useCallback(() => {
    setUsdValue("")
  }, [])

  return {
    isUsdMode,
    usdValue,
    tokenPrice,
    handleToggle,
    handleInputChange,
    clearUsdValue,
  }
}
