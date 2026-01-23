"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import {
  DEPOSIT_STAGES,
  DEPOSIT_STAGE_LABELS,
  DEPOSIT_STAGE_LABELS_SHORT,
  type DepositDisplayStage,
} from "@src/components/DefuseSDK/features/deposit/utils/depositStatusUtils"
import { chainTxExplorer } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import {
  HorizontalProgressDots,
  ProgressSteps,
} from "@src/components/ProgressIndicator"
import {
  type TrackedDeposit,
  useDepositTracker,
} from "@src/providers/DepositTrackerProvider"
import Button from "./Button"

type DepositStatusProps = {
  depositId: string
  variant: "dock" | "card"
}

export function DepositStatus({ depositId, variant }: DepositStatusProps) {
  const { trackedDeposits } = useDepositTracker()
  const deposit = trackedDeposits.find((d) => d.id === depositId)

  if (!deposit) {
    return null
  }

  const displayStage = mapStageToDisplayStage(deposit.stage)
  const displayIndex = DEPOSIT_STAGES.indexOf(displayStage)
  const hasError = deposit.stage === "error"
  const isSuccess = deposit.stage === "complete"

  if (variant === "dock") {
    return (
      <HorizontalProgressDots
        stages={DEPOSIT_STAGES}
        stageLabelsShort={DEPOSIT_STAGE_LABELS_SHORT}
        displayStage={displayStage}
        displayIndex={displayIndex}
        hasError={hasError}
        isSuccess={isSuccess}
      />
    )
  }

  return (
    <CardView
      deposit={deposit}
      displayStage={displayStage}
      displayIndex={displayIndex}
      hasError={hasError}
      isSuccess={isSuccess}
    />
  )
}

function mapStageToDisplayStage(
  stage: TrackedDeposit["stage"]
): DepositDisplayStage {
  switch (stage) {
    case "submitting":
      return "submitting"
    case "complete":
    case "error":
      return "complete"
    default:
      return "submitting"
  }
}

function CardView({
  deposit,
  displayStage,
  displayIndex,
  hasError,
  isSuccess,
}: {
  deposit: TrackedDeposit
  displayStage: DepositDisplayStage
  displayIndex: number
  hasError: boolean
  isSuccess: boolean
}) {
  const explorerBaseUrl = chainTxExplorer(deposit.chainName)
  const explorerUrl =
    deposit.txHash && explorerBaseUrl ? explorerBaseUrl + deposit.txHash : null

  return (
    <div className="bg-white rounded-2xl p-3 overflow-hidden">
      <div className="flex flex-col gap-3">
        <ProgressSteps
          stages={DEPOSIT_STAGES}
          stageLabels={DEPOSIT_STAGE_LABELS}
          displayStage={displayStage}
          displayIndex={displayIndex}
          hasError={hasError}
          isSuccess={isSuccess}
          size="sm"
        />

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
      </div>
    </div>
  )
}
