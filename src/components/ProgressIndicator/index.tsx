"use client"

import { CheckIcon, XMarkIcon } from "@heroicons/react/16/solid"
import clsx from "clsx"
import Spinner from "../Spinner"

export type StepSize = "sm" | "md"

function StepDot({
  isActive,
  isComplete,
  isError,
}: {
  isActive: boolean
  isComplete: boolean
  isError: boolean
}) {
  if (isActive && !isComplete && !isError) {
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
        isError && "bg-red-500",
        !isError && isComplete && "bg-green-500",
        !isError && !isComplete && "bg-surface-hover"
      )}
    >
      {isComplete && !isError && <CheckIcon className="size-2 text-white" />}
      {isError && <span className="text-white text-[8px] font-bold">!</span>}
    </div>
  )
}

export function ProgressStep({
  label,
  size,

  status,

  isLast,
  isCurrent,
  isPast,
  isFuture,
}: {
  label: string
  size: StepSize

  status: "success" | "error" | "pending"

  isLast: boolean
  isCurrent: boolean
  isPast: boolean
  isFuture: boolean
}) {
  const iconClasses = clsx("text-white", {
    "size-5": size === "md",
    "size-4": size === "sm",
  })

  return (
    <li
      className={clsx("relative flex items-center", {
        "pb-7": size === "md" && !isLast,
        "pb-4": size === "sm" && !isLast,
      })}
    >
      {/* Line between steps */}
      {!isLast && (
        <div
          className={clsx("absolute top-1 h-full transition-colors", {
            "left-4 w-1 -translate-x-0.5": size === "md",
            "left-2.5 w-0.5 -translate-x-px": size === "sm",

            "bg-red-500": status === "error",
            "bg-green-500": status === "success",
            "bg-sky-400": status === "pending" && !isCurrent && !isFuture,
            "bg-surface-hover": status === "pending" && (isCurrent || isFuture),
          })}
        />
      )}

      {/* Icon */}
      <div
        className={clsx(
          "relative flex items-center justify-center rounded-full shrink-0 transition-colors",
          {
            "size-8": size === "md",
            "size-5": size === "sm",

            "bg-red-500": status === "error",
            "bg-green-500": status === "success",
            "bg-sky-400": status === "pending" && !isFuture,
            "bg-surface-hover": status === "pending" && isFuture,
          }
        )}
      >
        {isPast ? (
          <CheckIcon className={iconClasses} />
        ) : isCurrent && status === "pending" ? (
          <Spinner size={size} className="text-white" />
        ) : isCurrent && status === "success" ? (
          <CheckIcon className={iconClasses} />
        ) : isCurrent && status === "error" ? (
          <XMarkIcon className={iconClasses} />
        ) : (
          <div
            className={clsx("absolute rounded-full bg-white", {
              "inset-0.5": size === "sm",
              "inset-1": size === "md",
            })}
          />
        )}
      </div>

      {/* Label */}
      <div
        className={clsx(
          "flex items-center justify-center font-semibold transition-colors",
          {
            "ml-3 text-sm": size === "md",
            "ml-2 text-sm": size === "sm",

            "text-red-500": status === "error",
            "text-green-500": status === "success",
            "text-sky-400": status === "pending" && !isFuture,
            "text-fg-tertiary": status === "pending" && isFuture,
          }
        )}
      >
        {label}
      </div>
    </li>
  )
}

type ProgressStepsProps<TStage extends string> = {
  stages: readonly TStage[]
  stageLabels: Record<TStage, string>
  displayStage: TStage
  displayIndex: number
  isError: boolean
  isSuccess: boolean
  size: StepSize
}

export function ProgressSteps<TStage extends string>({
  stages,
  stageLabels,
  displayStage,
  displayIndex,
  isError,
  isSuccess,
  size,
}: ProgressStepsProps<TStage>) {
  return (
    <ol>
      {stages.map((stage, i) => {
        const isLastStep = i === stages.length - 1

        return (
          <ProgressStep
            key={stage}
            size={size}
            label={
              stage === "complete" && isError ? "Failed" : stageLabels[stage]
            }
            status={isError ? "error" : isSuccess ? "success" : "pending"}
            isLast={isLastStep}
            isCurrent={displayStage === stage}
            isPast={displayIndex > i}
            isFuture={displayIndex < i}
          />
        )
      })}
    </ol>
  )
}

type HorizontalProgressDotsProps<TStage extends string> = {
  stages: readonly TStage[]
  stageLabelsShort: Record<TStage, string>
  displayStage: TStage
  displayIndex: number
  isError: boolean
  isSuccess: boolean
}

export function HorizontalProgressDots<TStage extends string>({
  stages,
  stageLabelsShort,
  displayStage,
  displayIndex,
  isError,
  isSuccess,
}: HorizontalProgressDotsProps<TStage>) {
  return (
    <div className="flex items-center gap-1.5">
      {stages.map((stage, index) => {
        const isActive = displayStage === stage
        const isDone = displayIndex > index
        const isFailed = isError && isActive && stage === "complete"

        return (
          <div key={stage} className="flex items-center gap-1.5">
            <StepDot
              isActive={isActive}
              isComplete={isDone || (isSuccess && stage === "complete")}
              isError={isFailed}
            />
            {index < stages.length - 1 && (
              <div
                className={clsx(
                  "w-4 h-px transition-colors duration-300",
                  isDone ? "bg-green-500" : "bg-surface-hover"
                )}
              />
            )}
          </div>
        )
      })}
      <span
        className={clsx(
          "ml-1 text-xs transition-colors duration-300",
          isError && "text-red-600",
          !isError && isSuccess && "text-green-600",
          !isError && !isSuccess && "text-fg-secondary"
        )}
      >
        {isError ? "Failed" : stageLabelsShort[displayStage]}
      </span>
    </div>
  )
}
