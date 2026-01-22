"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import { ArrowRightIcon, CheckIcon } from "@heroicons/react/20/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS,
  SWAP_STAGE_LABELS_SHORT,
  type StatusActorSnapshot,
  type SwapStage,
  extractStateValue,
  getStageFromState,
  is1csError,
  is1csSuccess,
  isIntentError,
  isIntentSuccess,
} from "@src/components/DefuseSDK/features/swap/utils/swapStatusUtils"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerProvider"
import { useSelector } from "@xstate/react"
import { useEffect, useState } from "react"
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
  const state = useSelector(
    swap.actorRef,
    (s): StatusActorSnapshot => s as StatusActorSnapshot
  )
  const stateValue = extractStateValue(state.value)
  const machineStage = getStageFromState(stateValue)

  const [displayStage, setDisplayStage] = useState<SwapStage>(machineStage)

  useEffect(() => {
    const machineIndex = SWAP_STAGES.indexOf(machineStage)
    const currentIndex = SWAP_STAGES.indexOf(displayStage)

    if (machineIndex > currentIndex) {
      setDisplayStage(machineStage)
    }
  }, [machineStage, displayStage])

  const displayIndex = SWAP_STAGES.indexOf(displayStage)

  // Use correct error/success detection based on machine type
  // Matches logic from Swap1csCard and SwapIntentCard
  const hasError = swap.is1cs
    ? is1csError(state.context.status)
    : isIntentError(stateValue)

  const isSuccess = swap.is1cs
    ? is1csSuccess(state.context.status)
    : isIntentSuccess(stateValue)

  const canRetry = state.can({ type: "RETRY" })
  const txHash = state.context.txHash

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
    <div className="flex items-center gap-1.5">
      {SWAP_STAGES.map((stage, index) => {
        const isActive = displayStage === stage
        const isDone = displayIndex > index
        const isFailed = hasError && isActive && stage === "complete"

        return (
          <div key={stage} className="flex items-center gap-1.5">
            <StepDot
              isActive={isActive}
              isComplete={isDone || (isSuccess && stage === "complete")}
              hasError={isFailed}
            />
            {index < SWAP_STAGES.length - 1 && (
              <div
                className={`w-4 h-px transition-colors duration-300 ${isDone ? "bg-green-500" : "bg-gray-200"}`}
              />
            )}
          </div>
        )
      })}
      <span
        className={`ml-1 text-xs transition-colors duration-300 ${hasError ? "text-red-600" : isSuccess ? "text-green-600" : "text-gray-500"}`}
      >
        {hasError ? "Failed" : SWAP_STAGE_LABELS_SHORT[displayStage]}
      </span>
    </div>
  )
}

function StepDot({
  isActive,
  isComplete,
  hasError,
}: {
  isActive: boolean
  isComplete: boolean
  hasError: boolean
}) {
  if (isActive && !isComplete && !hasError) {
    return (
      <div className="relative size-3 flex items-center justify-center">
        <svg
          aria-hidden="true"
          className="absolute inset-0 size-3 animate-spin"
          style={{ animationDuration: "1s" }}
        >
          <circle
            cx="6"
            cy="6"
            r="5"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="1.5"
          />
          <circle
            cx="6"
            cy="6"
            r="5"
            fill="none"
            stroke="#111827"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="16 16"
          />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={`size-3 rounded-full transition-colors duration-300 flex items-center justify-center ${
        hasError ? "bg-red-500" : isComplete ? "bg-green-500" : "bg-gray-200"
      }`}
    >
      {isComplete && !hasError && <CheckIcon className="size-2 text-white" />}
      {hasError && <span className="text-white text-[8px] font-bold">!</span>}
    </div>
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

// --- Shared Progress Steps (vertical) ---

function ProgressSteps({
  displayStage,
  displayIndex,
  hasError,
  isSuccess,
  size,
}: {
  displayStage: SwapStage
  displayIndex: number
  hasError: boolean
  isSuccess: boolean
  size: "sm" | "md"
}) {
  return (
    <div className={size === "md" ? "flex flex-col gap-0 mt-2" : "space-y-0"}>
      {SWAP_STAGES.map((stage, i) => {
        const isLastStep = i === SWAP_STAGES.length - 1
        return (
          <ProgressStep
            key={stage}
            size={size}
            label={
              stage === "complete" && hasError
                ? "Failed"
                : SWAP_STAGE_LABELS[stage]
            }
            isActive={displayStage === stage}
            isComplete={isLastStep ? isSuccess : displayIndex > i}
            hasError={stage === "complete" && hasError}
            isLast={isLastStep}
          />
        )
      })}
    </div>
  )
}

// --- Progress Step ---

const STEP_SIZES = {
  sm: {
    container: "size-4",
    icon: "size-2.5",
    errorText: "text-[10px]",
    line: "h-3",
    text: "text-xs",
    gap: "gap-2",
    svg: {
      size: 16,
      cx: 8,
      cy: 8,
      r: 6.5,
      strokeWidth: 1.5,
      dasharray: "20 20",
    },
  },
  md: {
    container: "size-6",
    icon: "size-3.5",
    errorText: "text-xs",
    line: "h-5",
    text: "text-sm pt-1",
    gap: "gap-3",
    svg: {
      size: 24,
      cx: 12,
      cy: 12,
      r: 10,
      strokeWidth: 2,
      dasharray: "32 32",
    },
  },
} as const

function ProgressStep({
  label,
  isActive,
  isComplete,
  hasError,
  isLast,
  size,
}: {
  label: string
  isActive: boolean
  isComplete: boolean
  hasError: boolean
  isLast: boolean
  size: "sm" | "md"
}) {
  const s = STEP_SIZES[size]

  return (
    <div className={`flex items-start ${s.gap}`}>
      <div className="flex flex-col items-center">
        <div
          className={`relative ${s.container} flex items-center justify-center`}
        >
          <div
            className={`absolute inset-0 rounded-full transition-colors duration-500 ease-out ${
              hasError && isActive
                ? "bg-red-500"
                : isComplete
                  ? "bg-green-500"
                  : isActive
                    ? "bg-transparent"
                    : "bg-gray-200"
            }`}
          />

          {isActive && !isComplete && !hasError && (
            <svg
              aria-hidden="true"
              className={`absolute inset-0 ${s.container} animate-spin`}
              style={{ animationDuration: "1s" }}
              viewBox={`0 0 ${s.svg.size} ${s.svg.size}`}
            >
              <circle
                cx={s.svg.cx}
                cy={s.svg.cy}
                r={s.svg.r}
                fill="none"
                stroke="#e5e7eb"
                strokeWidth={s.svg.strokeWidth}
              />
              <circle
                cx={s.svg.cx}
                cy={s.svg.cy}
                r={s.svg.r}
                fill="none"
                stroke="#111827"
                strokeWidth={s.svg.strokeWidth}
                strokeLinecap="round"
                strokeDasharray={s.svg.dasharray}
              />
            </svg>
          )}

          <div className="relative z-10">
            {isComplete && !hasError ? (
              <CheckIcon className={`${s.icon} text-white`} />
            ) : hasError && isActive ? (
              <span className={`text-white ${s.errorText} font-bold`}>!</span>
            ) : null}
          </div>
        </div>

        {!isLast && (
          <div
            className={`w-0.5 ${s.line} transition-colors duration-500 ease-out ${isComplete ? "bg-green-500" : "bg-gray-200"}`}
          />
        )}
      </div>

      <p
        className={`${s.text} transition-colors duration-300 ${
          hasError && isActive
            ? "text-red-600 font-medium"
            : isComplete
              ? "text-green-600 font-medium"
              : isActive
                ? "text-gray-900 font-medium"
                : "text-gray-400"
        }`}
      >
        {label}
      </p>
    </div>
  )
}
