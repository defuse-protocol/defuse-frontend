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
import {
  HorizontalProgressDots,
  ProgressSteps,
} from "@src/components/ProgressIndicator"
import type { TrackedWithdrawIntent } from "@src/providers/WithdrawTrackerProvider"
import Button from "./Button"

type WithdrawStatusProps = {
  withdraw: TrackedWithdrawIntent
  variant: "full" | "card" | "dock"
  onDismiss?: () => void
  onWithdrawAgain?: () => void
}

export function WithdrawStatus({
  withdraw,
  variant,
  onDismiss: _onDismiss,
  onWithdrawAgain,
}: WithdrawStatusProps) {
  const { displayStage, displayIndex, canRetry, txHash, stateValue } =
    useMachineStageProgress({
      actorRef: withdraw.actorRef,
      stages: WITHDRAW_STAGES,
      getStageFromState,
    })

  const hasError = isWithdrawError(stateValue)
  const isSuccess = isWithdrawSuccess(stateValue)

  if (variant === "dock") {
    return (
      <HorizontalProgressDots
        stages={WITHDRAW_STAGES}
        stageLabelsShort={WITHDRAW_STAGE_LABELS_SHORT}
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
        withdraw={withdraw}
        displayStage={displayStage}
        displayIndex={displayIndex}
        hasError={hasError}
        canRetry={canRetry}
        txHash={txHash}
        isSuccess={isSuccess}
      />
    )
  }

  return (
    <FullView
      withdraw={withdraw}
      displayStage={displayStage}
      displayIndex={displayIndex}
      hasError={hasError}
      canRetry={canRetry}
      isSuccess={isSuccess}
      onWithdrawAgain={onWithdrawAgain}
    />
  )
}

function FullView({
  withdraw,
  displayStage,
  displayIndex,
  hasError,
  canRetry,
  isSuccess,
  onWithdrawAgain,
}: {
  withdraw: TrackedWithdrawIntent
  displayStage: WithdrawStage
  displayIndex: number
  hasError: boolean
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

  return (
    <div className="flex flex-col">
      <div className="flex justify-between items-center">
        <h1 className="text-gray-900 text-xl font-semibold tracking-tight">
          Withdraw
        </h1>
      </div>

      <div className="mt-5 bg-gray-50 rounded-2xl p-6">
        <div className="flex flex-col items-center gap-4 mb-6">
          <AssetComboIcon sizeClassName="size-12" {...tokenOut} />
          <div className="text-center">
            <p className="text-sm font-semibold text-green-600">
              +{formattedAmount}
            </p>
            <p className="text-xs text-gray-500">{tokenOut.symbol}</p>
          </div>
          <p className="text-xs text-gray-400 truncate max-w-[200px]">
            To: {recipient}
          </p>
        </div>

        <ProgressSteps
          stages={WITHDRAW_STAGES}
          stageLabels={WITHDRAW_STAGE_LABELS}
          displayStage={displayStage}
          displayIndex={displayIndex}
          hasError={hasError}
          isSuccess={isSuccess}
          size="md"
        />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {isSuccess && (
          <Button size="xl" fullWidth onClick={onWithdrawAgain}>
            Withdraw again
          </Button>
        )}
        {hasError && canRetry && (
          <Button
            size="xl"
            fullWidth
            onClick={() => withdraw.actorRef.send({ type: "RETRY" })}
          >
            Retry
          </Button>
        )}
        {hasError && (
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

function CardView({
  withdraw,
  displayStage,
  displayIndex,
  hasError,
  canRetry,
  txHash,
  isSuccess,
}: {
  withdraw: TrackedWithdrawIntent
  displayStage: WithdrawStage
  displayIndex: number
  hasError: boolean
  canRetry: boolean
  txHash: string | null | undefined
  isSuccess: boolean
}) {
  const { tokenOut, amountOut } = withdraw

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
    <div className="bg-white rounded-2xl p-3 overflow-hidden">
      <div className="flex items-center gap-3 mb-3">
        <AssetComboIcon sizeClassName="size-6" {...tokenOut} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700">
            Withdraw {formattedAmount} {tokenOut.symbol}
          </p>
        </div>
      </div>

      <ProgressSteps
        stages={WITHDRAW_STAGES}
        stageLabels={WITHDRAW_STAGE_LABELS}
        displayStage={displayStage}
        displayIndex={displayIndex}
        hasError={hasError}
        isSuccess={isSuccess}
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
            onClick={() => withdraw.actorRef.send({ type: "RETRY" })}
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
