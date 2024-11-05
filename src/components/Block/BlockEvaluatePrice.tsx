"use client"

import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Tooltip } from "@radix-ui/themes"
import clsx from "clsx"
import React from "react"

import type { SwapEstimateProviderResponse } from "@src/libs/de-sdk/types/interfaces"
import type { NetworkToken } from "@src/types/interfaces"
import { tokenBalanceToFormatUnits } from "@src/utils/token"

import { EvaluateResultEnum } from "../../app/(home)/SwapForm/service/evaluateSwap"

const BEST_PRICE = "best price"
const LOW_PRICE = "low price"

const BlockEvaluatePrice = ({
  priceEvaluation,
  priceResults,
  tokenOut,
}: {
  priceEvaluation: EvaluateResultEnum | null
  priceResults: SwapEstimateProviderResponse[] | null
  tokenOut?: NetworkToken
}) => {
  return (
    <span className="flex flex-nowrap gap-2 items-center text-sm font-medium text-secondary">
      {priceEvaluation !== null && (
        <span
          className={clsx(
            "flex flex-nowrap items-center gap-1 p-1.5 py-0.5 rounded-full text-xs",
            EvaluateResultEnum.BEST && "bg-green-800 text-black",
            EvaluateResultEnum.LOW && "bg-pink text-white"
          )}
        >
          {priceEvaluation === EvaluateResultEnum.BEST ? BEST_PRICE : LOW_PRICE}
          {tokenOut && priceResults?.length && (
            <Tooltip
              content={
                <span className="flex flex-col gap-1">
                  {priceResults.map((providers, i) =>
                    providers.map((result) => {
                      return (
                        <span key={`${i}:${result.solver_id}`}>
                          Rate{" "}
                          {tokenBalanceToFormatUnits({
                            balance: result.amount_out,
                            decimals: tokenOut.decimals,
                          })}{" "}
                          from {result.solver_id}
                        </span>
                      )
                    })
                  )}
                </span>
              }
            >
              <InfoCircledIcon />
            </Tooltip>
          )}
        </span>
      )}
    </span>
  )
}

export default BlockEvaluatePrice
