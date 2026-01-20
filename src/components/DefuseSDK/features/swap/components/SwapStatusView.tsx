import { ArrowRightIcon, CheckIcon } from "@heroicons/react/20/solid"
import { XMarkIcon } from "@heroicons/react/24/outline"
import Button from "@src/components/Button"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerProvider"
import { useSelector } from "@xstate/react"
import { useEffect, useState } from "react"
import AssetComboIcon from "../../../components/Asset/AssetComboIcon"
import { formatTokenValue } from "../../../utils/format"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS,
  type StatusActorSnapshot,
  type SwapStage,
  extractStateValue,
  getStageFromState,
  isErrorState,
} from "../utils/swapStatusUtils"

type SwapStatusViewProps = {
  swap: TrackedSwapIntent
  onDismiss: () => void
  onSwapAgain: () => void
}

export function SwapStatusView({
  swap,
  onDismiss,
  onSwapAgain,
}: SwapStatusViewProps) {
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

  const canRetry = state.can({ type: "RETRY" })
  const isComplete = displayStage === "complete"
  const isSuccess = isComplete && !hasError

  const displayIndex = SWAP_STAGES.indexOf(displayStage)

  return (
    <div className="flex flex-col">
      {/* Header with dismiss */}
      <div className="flex justify-between items-center">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
          Swap
        </h1>
        <button
          type="button"
          onClick={onDismiss}
          className="p-2 -mr-2 text-gray-400 hover:text-gray-500 transition-colors"
          aria-label="Dismiss"
        >
          <XMarkIcon className="size-5" />
        </button>
      </div>

      {/* Status card */}
      <div className="mt-5 bg-gray-50 rounded-2xl p-6">
        {/* Token flow visualization */}
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

        {/* Progress steps */}
        <div className="flex flex-col gap-0 mt-2">
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
      </div>

      {/* Actions */}
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

        {!isComplete && (
          <Button size="xl" variant="secondary" fullWidth onClick={onDismiss}>
            Dismiss & swap again
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
    <div className="flex items-start gap-3">
      {/* Step indicator with connecting line */}
      <div className="flex flex-col items-center">
        <div className="relative size-6 flex items-center justify-center">
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
              className="absolute inset-0 size-6 animate-spin"
              style={{ animationDuration: "1s" }}
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="2"
              />
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke="#111827"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="32 32"
              />
            </svg>
          )}

          {/* Content */}
          <div className="relative z-10">
            {isComplete && !hasError ? (
              <CheckIcon className="size-3.5 text-white" />
            ) : hasError && isActive ? (
              <span className="text-white text-xs font-bold">!</span>
            ) : null}
          </div>
        </div>
        {!isLast && (
          <div
            className={`
              w-0.5 h-5 transition-colors duration-500 ease-out
              ${isComplete ? "bg-green-500" : "bg-gray-200"}
            `}
          />
        )}
      </div>

      {/* Label */}
      <p
        className={`
          text-sm pt-1 transition-colors duration-300
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
