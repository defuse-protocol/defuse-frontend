"use client"

import { CheckIcon } from "@heroicons/react/20/solid"
import {
  SWAP_STAGES,
  SWAP_STAGE_LABELS_SHORT,
  type StatusActorSnapshot,
  type SwapStage,
  extractStateValue,
  getStageFromState,
  isErrorState,
} from "@src/components/DefuseSDK/features/swap/utils/swapStatusUtils"
import type { TrackedSwapIntent } from "@src/providers/SwapTrackerProvider"
import { useSelector } from "@xstate/react"
import { useEffect, useState } from "react"

type SwapDockContentProps = {
  swap: TrackedSwapIntent
}

export function SwapDockContent({ swap }: SwapDockContentProps) {
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

  const isComplete = displayStage === "complete"
  const isSuccess = isComplete && !hasError
  const displayIndex = SWAP_STAGES.indexOf(displayStage)

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
                className={`w-4 h-px transition-colors duration-300 ${
                  isDone ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        )
      })}
      <span
        className={`ml-1 text-xs transition-colors duration-300 ${
          hasError
            ? "text-red-600"
            : isSuccess
              ? "text-green-600"
              : "text-gray-500"
        }`}
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
  return (
    <div className="relative size-3 flex items-center justify-center">
      {isActive && !isComplete && !hasError ? (
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
      ) : (
        <div
          className={`size-3 rounded-full transition-colors duration-300 flex items-center justify-center ${
            hasError
              ? "bg-red-500"
              : isComplete
                ? "bg-green-500"
                : "bg-gray-200"
          }`}
        >
          {isComplete && !hasError && (
            <CheckIcon className="size-2 text-white" />
          )}
          {hasError && (
            <span className="text-white text-[8px] font-bold">!</span>
          )}
        </div>
      )}
    </div>
  )
}
