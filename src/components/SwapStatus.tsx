"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { ArrowRightIcon } from "@heroicons/react/20/solid"
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
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import {
  HorizontalProgressDots,
  ProgressSteps,
} from "@src/components/ProgressIndicator"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerMachineProvider"
import Button from "./Button"

const NEAR_EXPLORER = "https://nearblocks.io"

type SwapStatusProps = {
  swap: TrackedSwapIntent
  variant: "full" | "card" | "dock"
  onDismiss?: () => void
  onSwapAgain?: () => void
}

export function SwapStatus({
  swap,
  variant,
  onDismiss: _onDismiss,
  onSwapAgain,
}: SwapStatusProps) {
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

  // Use correct error/success detection based on machine type
  // Matches logic from Swap1csCard and SwapIntentCard
  const hasError = swap.is1cs
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
        hasError={hasError}
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
        hasError={hasError}
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
      hasError={hasError}
      canRetry={canRetry}
      isSuccess={isSuccess}
      onSwapAgain={onSwapAgain}
    />
  )
}

// --- Dock View (minimal horizontal dots) ---

function DockView({
  displayStage,
  displayIndex,
  hasError,
  isSuccess,
}: {
  displayStage: SwapStage
  displayIndex: number
  hasError: boolean
  isSuccess: boolean
}) {
  return (
    <HorizontalProgressDots
      stages={SWAP_STAGES}
      stageLabelsShort={SWAP_STAGE_LABELS_SHORT}
      displayStage={displayStage}
      displayIndex={displayIndex}
      hasError={hasError}
      isSuccess={isSuccess}
    />
  )
}

// --- Full View (dialog/modal style) ---

function FullView({
  swap,
  displayStage,
  displayIndex,
  hasError,
  canRetry,
  isSuccess,
  onSwapAgain,
}: {
  swap: TrackedSwapIntent
  displayStage: SwapStage
  displayIndex: number
  hasError: boolean
  canRetry: boolean
  isSuccess: boolean
  onSwapAgain?: () => void
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

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
          Swap
        </h1>
      </div>

      <div className="mt-5 bg-gray-50 rounded-2xl p-6">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="flex flex-col items-center gap-2">
            <AssetComboIcon sizeClassName="size-12" {...tokenIn} />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-900">
                -{formattedAmountIn}
              </p>
              <p className="text-xs text-gray-500">{tokenIn.symbol}</p>
            </div>
          </div>

          <ArrowRightIcon className="size-5 text-gray-400 shrink-0" />

          <div className="flex flex-col items-center gap-2">
            <AssetComboIcon sizeClassName="size-12" {...tokenOut} />
            <div className="text-center">
              <p className="text-sm font-semibold text-green-600">
                +{formattedAmountOut}
              </p>
              <p className="text-xs text-gray-500">{tokenOut.symbol}</p>
            </div>
          </div>
        </div>

        <ProgressSteps
          stages={SWAP_STAGES}
          stageLabels={SWAP_STAGE_LABELS}
          displayStage={displayStage}
          displayIndex={displayIndex}
          hasError={hasError}
          isSuccess={isSuccess}
          size="md"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isSuccess && (
          <Button size="xl" fullWidth onClick={onSwapAgain}>
            Swap again
          </Button>
        )}
        {hasError && canRetry && (
          <Button
            size="xl"
            fullWidth
            onClick={() => swap.actorRef.send({ type: "RETRY" })}
          >
            Retry
          </Button>
        )}
        {hasError && (
          <Button size="xl" variant="secondary" fullWidth onClick={onSwapAgain}>
            Try a new swap
          </Button>
        )}
      </div>
    </div>
  )
}

// --- Card View (compact dock style) ---

function CardView({
  swap,
  displayStage,
  displayIndex,
  hasError,
  canRetry,
  txHash,
}: {
  swap: TrackedSwapIntent
  displayStage: SwapStage
  displayIndex: number
  hasError: boolean
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
        hasError={hasError}
        isSuccess={displayStage === "complete" && !hasError}
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
        {hasError && canRetry && (
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
