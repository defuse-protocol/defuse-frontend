"use client"

import { useState } from "react"

import { concurrentEstimateSwap } from "@src/libs/de-sdk"
import type {
  DataEstimateRequest,
  SolverQuoteData,
  SwapEstimateProviderResponse,
} from "@src/libs/de-sdk/types/interfaces"
import { logger } from "@src/utils/logger"
import sortBigIntDesc from "@src/utils/sortBigIntDesc"

const DEFAULT_ESTIMATES_VALUE = {
  allEstimates: null,
  bestEstimate: null,
}

type PriceData = {
  allEstimates: SwapEstimateProviderResponse[] | null
  bestEstimate: SolverQuoteData | null
}

const useSwapEstimateBot = () => {
  const [{ allEstimates, bestEstimate }, setPrices] = useState<{
    allEstimates: SwapEstimateProviderResponse[] | null
    bestEstimate: SolverQuoteData | null
  }>(DEFAULT_ESTIMATES_VALUE)
  const getSwapEstimateBot = async (
    data: DataEstimateRequest
  ): Promise<PriceData> => {
    try {
      setPrices(DEFAULT_ESTIMATES_VALUE)
      const estimates = await concurrentEstimateSwap(data)
      const sorted = estimates
        .map((estimatesItem) => {
          return estimatesItem.sort((a, b) =>
            sortBigIntDesc(a.amount_out, b.amount_out)
          )
        })
        .sort((a, b) => sortBigIntDesc(a[0].amount_out, b[0].amount_out))

      const bestOffers = sorted[0]
      if (bestOffers.length === 0) return DEFAULT_ESTIMATES_VALUE

      console.log("useSwapEstimateBot: ", sorted)

      const result = {
        allEstimates: sorted,
        bestEstimate: bestOffers[0],
      }
      setPrices(result)
      return result
    } catch (error) {
      logger.error(error)
      return DEFAULT_ESTIMATES_VALUE
    }
  }

  return {
    getSwapEstimateBot,
    allEstimates,
    bestEstimate,
  }
}

export default useSwapEstimateBot
