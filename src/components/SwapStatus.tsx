"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"

import { ArrowDownIcon, ArrowUturnLeftIcon } from "@heroicons/react/20/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { useMachineStageProgress } from "@src/components/DefuseSDK/features/common/useMachineStageProgress"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS,
  type SwapStage,
  getStageFromState,
  is1csError,
  is1csSuccess,
  isIntentError,
  isIntentSuccess,
} from "@src/components/DefuseSDK/features/swap/utils/swapStatusUtils"
import {
  formatTokenValue,
  formatUsdAmount,
} from "@src/components/DefuseSDK/utils/format"
import { ProgressSteps } from "@src/components/ProgressIndicator"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerMachineProvider"
import Button from "./Button"
import { useTokensUsdPrices } from "./DefuseSDK/hooks/useTokensUsdPrices"
import getTokenUsdPrice from "./DefuseSDK/utils/getTokenUsdPrice"
import PageHeader from "./PageHeader"

const NEAR_EXPLORER = "https://nearblocks.io"

type SwapStatusProps = {
  swap: TrackedSwapIntent
  variant: "full" | "card" | "dock"
  onSwapAgain?: () => void
}

export function SwapStatus({ swap, variant, onSwapAgain }: SwapStatusProps) {
  const {
    displayStage,
    displayIndex,
    canRetry,
    txHash,
    stateValue,
    contextStatus,
  } = useMachineStageProgress({
    actorRef: swap.actorRef,
    stages: SWAP_STAGES,
    getStageFromState,
  })

  const isError = swap.is1cs
    ? is1csError(contextStatus)
    : isIntentError(stateValue)

  const isSuccess = swap.is1cs
    ? is1csSuccess(contextStatus)
    : isIntentSuccess(stateValue)

  if (variant === "dock") {
    return (
      <DockView
        displayStage={displayStage}
        displayIndex={displayIndex}
        isError={isError}
        isSuccess={isSuccess}
      />
    )
  }

  return (
    <FullView
      swap={swap}
      txHash={txHash}
      displayStage={displayStage}
      displayIndex={displayIndex}
      isError={isError}
      canRetry={canRetry}
      isSuccess={isSuccess}
      onSwapAgain={onSwapAgain}
    />
  )
}

function DockView({
  displayStage,
  displayIndex,
  isError,
  isSuccess,
}: {
  displayStage: SwapStage
  displayIndex: number
  isError: boolean
  isSuccess: boolean
}) {
  return (
    <ProgressSteps
      stages={SWAP_STAGES}
      stageLabels={SWAP_STAGE_LABELS}
      displayStage={displayStage}
      displayIndex={displayIndex}
      isError={isError}
      isSuccess={isSuccess}
      size="sm"
    />
  )
}

function FullView({
  swap,
  txHash,
  displayStage,
  displayIndex,
  isError,
  canRetry,
  isSuccess,
  onSwapAgain,
}: {
  swap: TrackedSwapIntent
  txHash: string | null | undefined
  displayStage: SwapStage
  displayIndex: number
  isError: boolean
  canRetry: boolean
  isSuccess: boolean
  onSwapAgain?: () => void
}) {
  const { tokenIn, tokenOut, totalAmountIn, totalAmountOut } = swap
  const { data: tokensUsdPriceData } = useTokensUsdPrices()

  const formattedAmountIn = formatTokenValue(
    totalAmountIn.amount,
    totalAmountIn.decimals,
    { min: 0.0001, fractionDigits: 4 }
  )
  const formattedAmountOut = formatTokenValue(
    totalAmountOut.amount,
    totalAmountOut.decimals,
    { min: 0.0001, fractionDigits: 4 }
  )

  const usdAmountIn = getTokenUsdPrice(
    formattedAmountIn,
    tokenIn,
    tokensUsdPriceData
  )
  const usdAmountOut = getTokenUsdPrice(
    formattedAmountOut,
    tokenOut,
    tokensUsdPriceData
  )

  const explorerUrl = txHash ? `${NEAR_EXPLORER}/txns/${txHash}` : null

  return (
    <>
      <PageHeader title="Swap" />

      <div className="mt-5 bg-white border border-gray-200 rounded-3xl p-6">
        <div className="flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight leading-7">
                {formattedAmountIn} {tokenIn.symbol}
              </div>
              <div className="text-base/5 font-medium text-gray-500">
                {formatUsdAmount(usdAmountIn ?? 0)}
              </div>
            </div>
            <AssetComboIcon {...tokenIn} />
          </div>

          <ArrowDownIcon className="size-6 text-gray-400" />

          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight leading-7">
                {formattedAmountOut} {tokenOut.symbol}
              </div>
              <div className="text-base/5 font-medium text-gray-500">
                {formatUsdAmount(usdAmountOut ?? 0)}
              </div>
            </div>
            <AssetComboIcon icon={tokenOut?.icon} />
          </div>
        </div>

        <div className="mt-8 border-t border-gray-200 pt-8">
          <ProgressSteps
            stages={SWAP_STAGES}
            stageLabels={SWAP_STAGE_LABELS}
            displayStage={displayStage}
            displayIndex={displayIndex}
            isError={isError}
            isSuccess={isSuccess}
            size="md"
          />

          {explorerUrl && (
            <Button
              href={explorerUrl}
              variant="secondary"
              size="xl"
              target="_blank"
              rel="noopener noreferrer"
              fullWidth
              className="mt-6"
            >
              View on explorer
              <ArrowTopRightOnSquareIcon className="size-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isSuccess && (
          <Button size="xl" fullWidth onClick={onSwapAgain}>
            <ArrowUturnLeftIcon className="size-5 shrink-0" />
            Swap again
          </Button>
        )}
        {isError && canRetry && (
          <Button
            size="xl"
            fullWidth
            onClick={() => swap.actorRef.send({ type: "RETRY" })}
          >
            Retry
          </Button>
        )}
        {isError && (
          <Button size="xl" variant="secondary" fullWidth onClick={onSwapAgain}>
            Try a new swap
          </Button>
        )}
      </div>
    </>
  )
}
