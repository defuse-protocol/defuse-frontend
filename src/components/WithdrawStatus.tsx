"use client"

import { ArrowTopRightOnSquareIcon } from "@heroicons/react/16/solid"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { useMachineStageProgress } from "@src/components/DefuseSDK/features/common/useMachineStageProgress"
import {
  WITHDRAW_STAGES,
  WITHDRAW_STAGE_LABELS,
  WITHDRAW_STAGE_LABELS_SHORT,
  type WithdrawStage,
  getStageFromState,
  isWithdrawError,
  isWithdrawSuccess,
} from "@src/components/DefuseSDK/features/withdraw/utils/withdrawStatusUtils"
import { blockExplorerTxLinkFactory } from "@src/components/DefuseSDK/utils/chainTxExplorer"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { ProgressSteps } from "@src/components/ProgressIndicator"
import type { TrackedWithdrawIntent } from "@src/providers/WithdrawTrackerMachineProvider"
import Button from "./Button"
import PageHeader from "./PageHeader"

type WithdrawStatusProps = {
  withdraw: TrackedWithdrawIntent
  variant: "full" | "dock"
  onWithdrawAgain?: () => void
}

export function WithdrawStatus({
  withdraw,
  variant,
  onWithdrawAgain,
}: WithdrawStatusProps) {
  const { displayStage, displayIndex, canRetry, txHash, stateValue } =
    useMachineStageProgress({
      actorRef: withdraw.actorRef,
      stages: WITHDRAW_STAGES,
      getStageFromState,
    })

  const isError = isWithdrawError(stateValue)
  const isSuccess = isWithdrawSuccess(stateValue)

  if (variant === "dock") {
    return (
      <ProgressSteps
        stages={WITHDRAW_STAGES}
        stageLabels={WITHDRAW_STAGE_LABELS_SHORT}
        displayStage={displayStage}
        displayIndex={displayIndex}
        isError={isError}
        isSuccess={isSuccess}
        size="sm"
      />
    )
  }

  return (
    <FullView
      withdraw={withdraw}
      displayStage={displayStage}
      displayIndex={displayIndex}
      isError={isError}
      canRetry={canRetry}
      isSuccess={isSuccess}
      txHash={txHash}
      onWithdrawAgain={onWithdrawAgain}
    />
  )
}

function FullView({
  withdraw,
  txHash,
  displayStage,
  displayIndex,
  isError,
  canRetry,
  isSuccess,
  onWithdrawAgain,
}: {
  withdraw: TrackedWithdrawIntent
  txHash: string | null | undefined
  displayStage: WithdrawStage
  displayIndex: number
  isError: boolean
  canRetry: boolean
  isSuccess: boolean
  onWithdrawAgain?: () => void
}) {
  const { tokenOut, amountOut, recipient } = withdraw

  const formattedAmount = formatTokenValue(
    amountOut.amount,
    amountOut.decimals,
    {
      min: 0.0001,
      fractionDigits: 4,
    }
  )

  const explorerUrl = txHash ? blockExplorerTxLinkFactory("near", txHash) : null

  return (
    <div className="flex flex-col">
      <PageHeader title="Withdraw" />

      <div className="mt-5 bg-surface-page rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <AssetComboIcon sizeClassName="size-12" {...tokenOut} />
          <div className="text-center">
            <p className="text-sm font-semibold text-green-600">
              +{formattedAmount}
            </p>
            <p className="text-xs text-fg-secondary">{tokenOut.symbol}</p>
          </div>
          <p className="text-xs text-fg-tertiary truncate max-w-[200px]">
            To: {recipient}
          </p>
        </div>

        <ProgressSteps
          stages={WITHDRAW_STAGES}
          stageLabels={WITHDRAW_STAGE_LABELS}
          displayStage={displayStage}
          displayIndex={displayIndex}
          isError={isError}
          isSuccess={isSuccess}
          size="md"
        />

        {explorerUrl && (
          <Button
            href={explorerUrl}
            variant="primary"
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

      <div className="mt-6 flex flex-col gap-3">
        {isSuccess && (
          <Button size="xl" fullWidth onClick={onWithdrawAgain}>
            Withdraw again
          </Button>
        )}
        {isError && canRetry && (
          <Button
            size="xl"
            fullWidth
            onClick={() => withdraw.actorRef.send({ type: "RETRY" })}
          >
            Retry
          </Button>
        )}
        {isError && (
          <Button
            size="xl"
            variant="secondary"
            fullWidth
            onClick={onWithdrawAgain}
          >
            Try a new withdrawal
          </Button>
        )}
      </div>
    </div>
  )
}
