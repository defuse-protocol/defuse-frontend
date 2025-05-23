import { getQuote } from "@defuse-protocol/defuse-sdk/utils"
import { NextResponse } from "next/server"

import { SolverLiquidityService } from "@src/services/SolverLiquidityService"
import type {
  LastLiquidityCheckStatus,
  MaxLiquidityInJson,
} from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { joinAddresses } from "@src/utils/tokenUtils"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET() {
  const solverLiquidityService = new SolverLiquidityService()
  const tokenPairs = solverLiquidityService.getPairs()
  if (tokenPairs == null) {
    logger.error("tokenPairs was null")
    return NextResponse.json({ error: "tokenPairs was null" }, { status: 500 })
  }

  const tokenPairsLiquidity = await solverLiquidityService.getMaxLiquidityData()
  if (tokenPairsLiquidity == null) {
    logger.error("tokenPairsLiquidity was null")
    return NextResponse.json(
      { error: "tokenPairsLiquidity was null" },
      { status: 500 }
    )
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

    const quoteParams = {
      defuse_asset_identifier_in: token.in.defuseAssetId,
      defuse_asset_identifier_out: token.out.defuseAssetId,
      exact_amount_in: maxLiquidity.amount.value,
    }

    getQuote({
      quoteParams,
      config: {
        logBalanceSufficient: false,
      },
    })
      .then(() => {
        tokenPairsLiquidity[joinedAddressesKey] = prepareUpdatedLiquidity(
          maxLiquidity,
          true
        )

        solverLiquidityService.setMaxLiquidityData(tokenPairsLiquidity)
      })
      .catch(() => {
        tokenPairsLiquidity[joinedAddressesKey] = prepareUpdatedLiquidity(
          maxLiquidity,
          false
        )
        solverLiquidityService.setMaxLiquidityData(tokenPairsLiquidity)

        // enable it if you want to debug, disabled as we are out of sentry errors limit, this generates a lot of errors
        // logger.error(`${err}: ${joinedAddressesKey}`)
      })

    await delay(50 + Math.floor(Math.random() * 50))
  }

  return NextResponse.json({ error: null }, { status: 200 })
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

  let currentAmount = BigInt(amount_.value)
  let validatedAmount = BigInt(validatedAmount_.value)
  const basicStep = currentAmount / 10n
  let currentStep =
    lastStepSize_ == null ? currentAmount / 5n : BigInt(lastStepSize_.value)

  let currentLiquidityCheck: LastLiquidityCheckStatus

  if (hasLiquidity) {
    validatedAmount = currentAmount
    currentLiquidityCheck = "passed"

    if (!lastLiquidityCheck || currentLiquidityCheck === lastLiquidityCheck) {
      currentAmount += currentStep
      currentStep *= 2n
    } else {
      currentAmount += currentStep / 2n
      currentStep = basicStep
    }
  } else {
    // in case smaller amount failed, then no need to keep bigger value as validatedAmount
    validatedAmount =
      validatedAmount > currentAmount ? currentAmount : validatedAmount

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
