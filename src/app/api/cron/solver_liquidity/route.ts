import { NextResponse } from "next/server"

import type {
  AggregatedQuote,
  AggregatedQuoteErr,
} from "@defuse-protocol/defuse-sdk/types"
import { manyQuotes } from "@defuse-protocol/defuse-sdk/utils"
import { SolverLiquidityService } from "@src/services/SolverLiquidityService"
import type {
  LastLiquidityCheckStatus,
  MaxLiquidityInJson,
} from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { joinAddresses } from "@src/utils/tokenUtils"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function POST() {
  const tokenPairs = SolverLiquidityService.getPairs()
  if (tokenPairs == null) {
    logger.error("tokenPairs was null")
    return NextResponse.json({
      success: false,
      reason: "tokenPairs was null",
    })
  }

  const tokenPairsLiquidity = await SolverLiquidityService.getMaxLiquidityData()
  if (tokenPairsLiquidity == null) {
    logger.error("tokenPairsLiquidity was null")
    return NextResponse.json({
      success: false,
      reason: "tokenPairsLiquidity was null",
    })
  }

  for (const token of tokenPairs) {
    const joinedAddressesKey = joinAddresses([
      token.in.defuseAssetId,
      token.out.defuseAssetId,
    ])

    const maxLiquidity = tokenPairsLiquidity[joinedAddressesKey]

    if (!maxLiquidity) {
      logger.error(`No maxLiquidity: ${joinedAddressesKey}`)
      continue
    }

    const quoteParams = [
      {
        tokenIn: token.in.defuseAssetId,
        tokenOut: token.out.defuseAssetId,
        amountIn: maxLiquidity.amount.value,
      },
    ]

    await manyQuotes(quoteParams, {
      logBalanceSufficient: false,
    })
      .then((quotes: { val: AggregatedQuote | AggregatedQuoteErr }) => {
        const hasLiquidity = !("reason" in quotes.val)
        tokenPairsLiquidity[joinedAddressesKey] = prepareUpdatedLiquidity(
          maxLiquidity,
          hasLiquidity
        )
      })
      .catch((err: Error) => {
        logger.error(`${err}: ${joinedAddressesKey}`)
      })

    await delay(500)
  }

  await SolverLiquidityService.setMaxLiquidityData(tokenPairsLiquidity)

  return NextResponse.json({
    success: true,
  })
}

const prepareUpdatedLiquidity = (
  maxLiquidity: MaxLiquidityInJson,
  hasLiquidity: boolean
) => {
  const {
    amount: amount_,
    validatedAmount: validatedAmount_,
    lastStepSize: lastStepSize_,
    lastLiquidityCheck,
  } = maxLiquidity

  const amount = BigInt(amount_.value)
  let validatedAmount = BigInt(validatedAmount_.value)
  let currentAmount: bigint = BigInt(amount)
  const basicStep = currentAmount / BigInt(10)
  let currentStep =
    lastStepSize_ == null
      ? currentAmount / BigInt(5)
      : BigInt(lastStepSize_.value)

  let currentLiquidityCheck: LastLiquidityCheckStatus

  if (hasLiquidity) {
    validatedAmount = amount
    currentLiquidityCheck = "passed"

    if (!lastLiquidityCheck || currentLiquidityCheck === lastLiquidityCheck) {
      currentAmount += currentStep
      currentStep *= 2n
    } else {
      currentAmount += currentStep / 2n
      currentStep = basicStep
    }
  } else {
    const tempAmount = currentAmount
    currentLiquidityCheck = "failed"

    if (!lastLiquidityCheck || currentLiquidityCheck === lastLiquidityCheck) {
      currentAmount -= currentStep
      currentStep *= 2n
    } else {
      currentAmount -= currentStep / 2n
      currentStep = basicStep
    }
    if (currentAmount <= 0n) {
      currentAmount = tempAmount / 2n
      currentStep = currentAmount
    }
  }

  return {
    validatedAmount: { value: validatedAmount.toString(), __type: "bigint" },
    amount: { value: currentAmount.toString(), __type: "bigint" },
    lastStepSize: { value: currentStep.toString(), __type: "bigint" },
    lastLiquidityCheck: currentLiquidityCheck,
  }
}
