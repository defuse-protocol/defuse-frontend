import { formatUnits } from "viem"

import { swapEstimateRefFinanceProvider } from "@src/libs/de-sdk/providers/refFinanceProvider"
import { NetworkToken } from "@src/types/interfaces"
import { NEAR_TOKEN_META, W_NEAR_TOKEN_META } from "@src/constants/tokens"

export enum EvaluateResultEnum {
  BEST,
  LOW,
}

const ESTIMATE_DIFFERENCE_PERCENTAGE = 2
function prepareRefAddressData(address: string) {
  if (address === NEAR_TOKEN_META.address) return W_NEAR_TOKEN_META.address
  return address
}
const getSwapEstimateFromRefFinance = async (
  tokenIn: NetworkToken,
  tokenOut: NetworkToken,
  amountIn: string,
  bestOut: string
): Promise<EvaluateResultEnum | null> => {
  try {
    const result = await swapEstimateRefFinanceProvider({
      tokenIn: prepareRefAddressData(tokenIn.address!),
      tokenOut: prepareRefAddressData(tokenOut.address!),
      amountIn,
    })

    if (result === "0") return null
    const refFinancePrice = +result
    const bestOutN = +formatUnits(BigInt(bestOut), tokenOut.decimals!)
    if (bestOutN > refFinancePrice) {
      return EvaluateResultEnum.BEST
    }

    const difference = Math.abs(Number(bestOutN) - refFinancePrice)
    const average = (bestOutN + refFinancePrice) / 2
    const percentageDifference = (difference / average) * 100

    if (percentageDifference > ESTIMATE_DIFFERENCE_PERCENTAGE) {
      return EvaluateResultEnum.LOW
    }

    return null
  } catch (e) {
    console.error("Failed to get evaluation from Ref Finance", e)
    return null
  }
}

export const getEvaluateSwapEstimate = async (
  tokenIn: NetworkToken,
  tokenOut: NetworkToken,
  amountIn: string,
  bestOut: string
): Promise<{
  refFinance: EvaluateResultEnum | null
}> => {
  return {
    refFinance:
      tokenIn.blockchain === "near" && tokenOut.blockchain === "near"
        ? await getSwapEstimateFromRefFinance(
            tokenIn,
            tokenOut,
            amountIn,
            bestOut
          )
        : null,
  }
}