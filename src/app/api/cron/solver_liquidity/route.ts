import { NextResponse } from "next/server"

import { getQuote } from "@defuse-protocol/defuse-sdk/utils"
import {
  LIST_TOKEN_PAIRS,
  getMaxLiquidityData,
  setMaxLiquidityData,
} from "@src/services/SolverLiquidityService"
import type {
  LastLiquidityCheckStatus,
  MaxLiquidity,
} from "@src/types/interfaces"
import { logger } from "@src/utils/logger"
import { joinAddresses } from "@src/utils/tokenUtils"

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function GET() {
  const tokenPairs = LIST_TOKEN_PAIRS
  if (tokenPairs == null) {
    logger.error("tokenPairs was null")
    return NextResponse.json({ error: "tokenPairs was null" }, { status: 500 })
  }

  const tokenPairsLiquidity = await getMaxLiquidityData()
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
      exact_amount_in: maxLiquidity.amount,
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

        setMaxLiquidityData(
          joinedAddressesKey,
          tokenPairsLiquidity[joinedAddressesKey]
        )
      })
      .catch(() => {
        tokenPairsLiquidity[joinedAddressesKey] = prepareUpdatedLiquidity(
          maxLiquidity,
          false
        )
        setMaxLiquidityData(
          joinedAddressesKey,
          tokenPairsLiquidity[joinedAddressesKey]
        )

        // enable it if you want to debug, disabled as we are out of sentry errors limit, this generates a lot of errors
        // logger.error(`${err}: ${joinedAddressesKey}`)
      })

    await delay(50 + Math.floor(Math.random() * 50))
  }

  return NextResponse.json({ error: null }, { status: 200 })
}

const prepareUpdatedLiquidity = (
  maxLiquidity: MaxLiquidity,
  hasLiquidity: boolean
): MaxLiquidity => {
  const {
    amount: amount_,
    validated_amount: validatedAmount_,
    last_step_size: lastStepSize_,
    last_liquidity_check,
  } = maxLiquidity

  let currentAmount = BigInt(amount_)
  let validatedAmount = BigInt(validatedAmount_)
  const basicStep = currentAmount / 10n
  let currentStep =
    lastStepSize_ == null ? currentAmount / 5n : BigInt(lastStepSize_)

  let currentLiquidityCheck: LastLiquidityCheckStatus

  if (hasLiquidity) {
    validatedAmount = currentAmount
    currentLiquidityCheck = "passed"

    if (
      !last_liquidity_check ||
      currentLiquidityCheck === last_liquidity_check
    ) {
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

    if (
      !last_liquidity_check ||
      currentLiquidityCheck === last_liquidity_check
    ) {
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
    validated_amount: validatedAmount.toString(),
    amount: currentAmount.toString(),
    last_step_size: currentStep.toString(),
    last_liquidity_check: currentLiquidityCheck,
  }
}
