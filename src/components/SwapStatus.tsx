"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { ArrowDownIcon } from "@heroicons/react/20/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { useMachineStageProgress } from "@src/components/DefuseSDK/features/common/useMachineStageProgress"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS,
  SWAP_STAGE_LABELS_SHORT,
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
import {
  HorizontalProgressDots,
  ProgressSteps,
} from "@src/components/ProgressIndicator"
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

  if (variant === "card") {
    return (
      <CardView
        swap={swap}
        displayStage={displayStage}
        displayIndex={displayIndex}
        isError={isError}
        canRetry={canRetry}
        txHash={txHash}
      />
    )
  }

  return (
    <FullView
      swap={swap}
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
    <HorizontalProgressDots
      stages={SWAP_STAGES}
      stageLabelsShort={SWAP_STAGE_LABELS_SHORT}
      displayStage={displayStage}
      displayIndex={displayIndex}
      isError={isError}
      isSuccess={isSuccess}
    />
  )
}

function FullView({
  swap,
  displayStage,
  displayIndex,
  isError,
  canRetry,
  isSuccess,
  onSwapAgain,
}: {
  swap: TrackedSwapIntent
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
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isSuccess && (
          <Button size="xl" fullWidth onClick={onSwapAgain}>
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

function CardView({
  swap,
  displayStage,
  displayIndex,
  isError,
  canRetry,
  txHash,
}: {
  swap: TrackedSwapIntent
  displayStage: SwapStage
  displayIndex: number
  isError: boolean
  canRetry: boolean
  txHash: string | null | undefined
}) {
  const { tokenIn, tokenOut, totalAmountIn, totalAmountOut } = swap

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

  const explorerUrl = txHash ? `${NEAR_EXPLORER}/txns/${txHash}` : null

  return (
    <div className="bg-white rounded-2xl p-3 overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center -space-x-1.5">
          <AssetComboIcon sizeClassName="size-6" {...tokenIn} />
          <AssetComboIcon sizeClassName="size-6" {...tokenOut} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700">
            {formattedAmountIn} {tokenIn.symbol} → {formattedAmountOut}{" "}
            {tokenOut.symbol}
          </p>
        </div>
      </div>

      <ProgressSteps
        stages={SWAP_STAGES}
        stageLabels={SWAP_STAGE_LABELS}
        displayStage={displayStage}
        displayIndex={displayIndex}
        isError={isError}
        isSuccess={displayStage === "complete" && !isError}
        size="sm"
      />

      <div className="flex flex-col gap-2 mt-3">
        {explorerUrl && (
          <Button
            href={explorerUrl}
            variant="primary"
            target="_blank"
            rel="noopener noreferrer"
            fullWidth
          >
            View on explorer
            <ArrowTopRightOnSquareIcon className="size-4" />
          </Button>
        )}
        {isError && canRetry && (
          <Button
            onClick={() => swap.actorRef.send({ type: "RETRY" })}
            variant="primary"
            fullWidth
          >
            Retry
          </Button>
        )}
      </div>
    </div>
  )
}
