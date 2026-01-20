"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { CheckIcon } from "@heroicons/react/20/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS,
  type StatusActorSnapshot,
  type SwapStage,
  extractStateValue,
  getStageFromState,
  isErrorState,
} from "@src/components/DefuseSDK/features/swap/utils/swapStatusUtils"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerProvider"
import { useSelector } from "@xstate/react"
import { useEffect, useState } from "react"
import Button from "./Button"

type SwapTrackingCardProps = {
  swap: TrackedSwapIntent
  onDismiss: () => void
}

const NEAR_EXPLORER = "https://nearblocks.io"

export function SwapTrackingCard({ swap, onDismiss }: SwapTrackingCardProps) {
  const state = useSelector(
    swap.actorRef,
    (s): StatusActorSnapshot => s as StatusActorSnapshot
  )
  const stateValue = extractStateValue(state.value)

  const machineStage = getStageFromState(stateValue)
  const hasError = isErrorState(stateValue)

  const [displayStage, setDisplayStage] = useState<SwapStage>("finding")
  const [hasShownCompeting, setHasShownCompeting] = useState(false)

  useEffect(() => {
    const machineIndex = SWAP_STAGES.indexOf(machineStage)
    const displayIndex = SWAP_STAGES.indexOf(displayStage)

    if (machineIndex > displayIndex) {
      setDisplayStage(machineStage)
      return
    }

    if (
      displayStage === "finding" &&
      !hasShownCompeting &&
      machineStage === "finding"
    ) {
      const timer = setTimeout(() => {
        setDisplayStage("competing")
        setHasShownCompeting(true)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [machineStage, displayStage, hasShownCompeting])

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

  const txHash = state.context.txHash
  const explorerUrl = txHash ? `${NEAR_EXPLORER}/txns/${txHash}` : null
  const canRetry = state.can({ type: "RETRY" })

  const isComplete = displayStage === "complete"
  const isSuccess = isComplete && !hasError
  const displayIndex = SWAP_STAGES.indexOf(displayStage)

  return (
    <div className="bg-white rounded-2xl p-3 overflow-hidden">
      {/* Token pair header */}
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

      {/* Progress steps - compact */}
      <div className="space-y-0">
        <ProgressStep
          label={SWAP_STAGE_LABELS.finding}
          isActive={displayStage === "finding"}
          isComplete={displayIndex > 0}
          hasError={false}
        />
        <ProgressStep
          label={SWAP_STAGE_LABELS.competing}
          isActive={displayStage === "competing"}
          isComplete={displayIndex > 1}
          hasError={false}
        />
        <ProgressStep
          label={SWAP_STAGE_LABELS.executing}
          isActive={displayStage === "executing"}
          isComplete={displayIndex > 2}
          hasError={false}
        />
        <ProgressStep
          label={hasError ? "Failed" : SWAP_STAGE_LABELS.complete}
          isActive={displayStage === "complete"}
          isComplete={isSuccess}
          hasError={hasError}
          isLast
        />
      </div>

      {/* Actions */}
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

        <Button
          onClick={onDismiss}
          variant="secondary"
          className="border border-gray-200"
          fullWidth
        >
          Dismiss
        </Button>
      </div>
    </div>
  )
}

type ProgressStepProps = {
  label: string
  isActive: boolean
  isComplete: boolean
  hasError: boolean
  isLast?: boolean
}

function ProgressStep({
  label,
  isActive,
  isComplete,
  hasError,
  isLast = false,
}: ProgressStepProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="flex flex-col items-center">
        <div className="relative size-4 flex items-center justify-center">
          {/* Background circle */}
          <div
            className={`
              absolute inset-0 rounded-full transition-colors duration-500 ease-out
              ${
                hasError && isActive
                  ? "bg-red-500"
                  : isComplete
                    ? "bg-green-500"
                    : isActive
                      ? "bg-transparent"
                      : "bg-gray-200"
              }
            `}
          />

          {/* Spinning arc for active state */}
          {isActive && !isComplete && !hasError && (
            <svg
              aria-hidden="true"
              className="absolute inset-0 size-4 animate-spin"
              style={{ animationDuration: "1s" }}
            >
              <circle
                cx="8"
                cy="8"
                r="6.5"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="1.5"
              />
              <circle
                cx="8"
                cy="8"
                r="6.5"
                fill="none"
                stroke="#111827"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray="20 20"
              />
            </svg>
          )}

          {/* Content */}
          <div className="relative z-10">
            {isComplete && !hasError ? (
              <CheckIcon className="size-2.5 text-white" />
            ) : hasError && isActive ? (
              <span className="text-white text-[10px] font-bold">!</span>
            ) : null}
          </div>
        </div>
        {!isLast && (
          <div
            className={`
              w-0.5 h-3 transition-colors duration-500 ease-out
              ${isComplete ? "bg-green-500" : "bg-gray-200"}
            `}
          />
        )}
      </div>

      <p
        className={`
          text-xs transition-colors duration-300
          ${
            hasError && isActive
              ? "text-red-600 font-medium"
              : isComplete
                ? "text-green-600 font-medium"
                : isActive
                  ? "text-gray-900 font-medium"
                  : "text-gray-400"
          }
        `}
      >
        {label}
      </p>
    </div>
  )
}
