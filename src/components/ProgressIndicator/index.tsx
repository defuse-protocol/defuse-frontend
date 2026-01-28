"use client"

import { CheckIcon } from "@heroicons/react/20/solid"
import clsx from "clsx"

export const STEP_SIZES = {
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

export type StepSize = keyof typeof STEP_SIZES

export function StepDot({
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
      className={clsx(
        "size-3 rounded-full transition-colors duration-300 flex items-center justify-center",
        hasError && "bg-red-500",
        !hasError && isComplete && "bg-green-500",
        !hasError && !isComplete && "bg-gray-200"
      )}
    >
      {isComplete && !hasError && <CheckIcon className="size-2 text-white" />}
      {hasError && <span className="text-white text-[8px] font-bold">!</span>}
    </div>
  )
}

export function ProgressStep({
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
  size: StepSize
}) {
  const s = STEP_SIZES[size]

  return (
    <div className={clsx("flex items-start", s.gap)}>
      <div className="flex flex-col items-center">
        <div
          className={clsx(
            "relative flex items-center justify-center",
            s.container
          )}
        >
          <div
            className={clsx(
              "absolute inset-0 rounded-full transition-colors duration-500 ease-out",
              hasError && isActive && "bg-red-500",
              !hasError && isComplete && "bg-green-500",
              !hasError && !isComplete && isActive && "bg-transparent",
              !hasError && !isComplete && !isActive && "bg-gray-200"
            )}
          />

          {isActive && !isComplete && !hasError && (
            <svg
              aria-hidden="true"
              className={clsx("absolute inset-0 animate-spin", s.container)}
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
              <CheckIcon className={clsx(s.icon, "text-white")} />
            ) : hasError && isActive ? (
              <span className={clsx("text-white font-bold", s.errorText)}>
                !
              </span>
            ) : null}
          </div>
        </div>

        {!isLast && (
          <div
            className={clsx(
              "w-0.5 transition-colors duration-500 ease-out",
              s.line,
              isComplete ? "bg-green-500" : "bg-gray-200"
            )}
          />
        )}
      </div>

      <p
        className={clsx(
          s.text,
          "transition-colors duration-300",
          hasError && isActive && "text-red-600 font-medium",
          !hasError && isComplete && "text-green-600 font-medium",
          !hasError && !isComplete && isActive && "text-gray-900 font-medium",
          !hasError && !isComplete && !isActive && "text-gray-400"
        )}
      >
        {label}
      </p>
    </div>
  )
}

type ProgressStepsProps<TStage extends string> = {
  stages: readonly TStage[]
  stageLabels: Record<TStage, string>
  displayStage: TStage
  displayIndex: number
  hasError: boolean
  isSuccess: boolean
  size: StepSize
}

export function ProgressSteps<TStage extends string>({
  stages,
  stageLabels,
  displayStage,
  displayIndex,
  hasError,
  isSuccess,
  size,
}: ProgressStepsProps<TStage>) {
  return (
    <div className={size === "md" ? "flex flex-col gap-0 mt-2" : "space-y-0"}>
      {stages.map((stage, i) => {
        const isLastStep = i === stages.length - 1
        return (
          <ProgressStep
            key={stage}
            size={size}
            label={
              stage === "complete" && hasError ? "Failed" : stageLabels[stage]
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

type HorizontalProgressDotsProps<TStage extends string> = {
  stages: readonly TStage[]
  stageLabelsShort: Record<TStage, string>
  displayStage: TStage
  displayIndex: number
  hasError: boolean
  isSuccess: boolean
}

export function HorizontalProgressDots<TStage extends string>({
  stages,
  stageLabelsShort,
  displayStage,
  displayIndex,
  hasError,
  isSuccess,
}: HorizontalProgressDotsProps<TStage>) {
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((stage, index) => {
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
            {index < stages.length - 1 && (
              <div
                className={clsx(
                  "w-4 h-px transition-colors duration-300",
                  isDone ? "bg-green-500" : "bg-gray-200"
                )}
              />
            )}
          </div>
        )
      })}
      <span
        className={clsx(
          "ml-1 text-xs transition-colors duration-300",
          hasError && "text-red-600",
          !hasError && isSuccess && "text-green-600",
          !hasError && !isSuccess && "text-gray-500"
        )}
      >
        {hasError ? "Failed" : stageLabelsShort[displayStage]}
      </span>
    </div>
  )
}
