import Spinner from "@src/components/Spinner"
import type { DockItemBase } from "@src/providers/ActivityDockProvider"
import { useSelector } from "@xstate/react"
import clsx from "clsx"
import { useEffect } from "react"
import type { ActorRefFrom } from "xstate"
import type { intentStatusMachine } from "../../features/machines/intentStatusMachine"
import { midTruncate } from "../../features/withdraw/components/WithdrawForm/utils"
import { assert } from "../../utils/assert"
import { blockExplorerTxLinkFactory } from "../../utils/chainTxExplorer"
import { formatTokenValue } from "../../utils/format"
import TooltipNew from "../TooltipNew"
import { CopyButton } from "./CopyButton"

type WithdrawDockItemContentProps = {
  intentStatusActorRef: ActorRefFrom<typeof intentStatusMachine>
  updateItem: (updates: Partial<DockItemBase>) => void
}

const WithdrawDockItemContent = ({
  intentStatusActorRef,
  updateItem,
}: WithdrawDockItemContentProps) => {
  const state = useSelector(intentStatusActorRef, (state) => state)
  const { intentDescription, bridgeTransactionResult } = state.context

  assert(intentDescription.type === "withdraw", "Type must be withdraw")
  const { amountWithdrawn, tokenOut, tokenOutDeployment } = intentDescription

  const sourceTxHash = state.context.txHash
  const sourceTxUrl =
    sourceTxHash != null
      ? blockExplorerTxLinkFactory("near", sourceTxHash)
      : undefined

  const destTxHash = bridgeTransactionResult?.destinationTxHash
  const destTxUrl =
    destTxHash != null
      ? blockExplorerTxLinkFactory(
          intentDescription.nearIntentsNetwork
            ? "near"
            : tokenOutDeployment.chainName,
          destTxHash
        )
      : undefined

  const retryCount = state.context.bridgeRetryCount

  useEffect(() => {
    const title = getStatusTitle(state.value as string)
    updateItem({ title })

    if (destTxUrl) {
      updateItem({ explorerUrl: destTxUrl })
    } else if (sourceTxUrl) {
      updateItem({ explorerUrl: sourceTxUrl })
    }
  }, [state.value, destTxUrl, sourceTxUrl, updateItem])

  const isLoading =
    state.matches("pending") ||
    state.matches("checking") ||
    state.matches("waitingForBridge") ||
    state.matches("retryDelay")

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 font-medium">Status</span>
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-900">
          {retryCount > 0 &&
            (state.matches("waitingForBridge") ||
              state.matches("retryDelay")) && (
              <LongRunningStatusLabel retryCount={retryCount} />
            )}
          {isLoading && <Spinner size="sm" />}
          <span
            className={clsx({
              "text-red-600":
                state.matches("error") || state.matches("not_valid"),
              "text-green-600": state.matches("success"),
            })}
            data-testid={
              state.value === "success" ? "withdraw-success" : undefined
            }
          >
            {renderStatusLabel(state.value)}
          </span>
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-gray-500 font-medium">Amount</span>
        <span
          className={clsx(
            "text-sm font-semibold",
            state.matches("not_valid")
              ? "text-gray-500 line-through"
              : "text-gray-900"
          )}
        >
          {formatTokenValue(amountWithdrawn.amount, amountWithdrawn.decimals, {
            min: 0.0001,
            fractionDigits: 4,
          })}{" "}
          {tokenOut.symbol}
        </span>
      </div>

      {state.context.intentHash != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 font-medium">Intent</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            {midTruncate(state.context.intentHash)}
            <CopyButton
              text={state.context.intentHash}
              ariaLabel="Copy Intent hash"
            />
          </span>
        </div>
      )}

      {sourceTxHash != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 font-medium">Source Tx</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            <a
              href={sourceTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {midTruncate(sourceTxHash)}
            </a>
            <CopyButton
              text={sourceTxHash}
              ariaLabel="Copy Source Transaction"
            />
          </span>
        </div>
      )}

      {destTxHash != null && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-gray-500 font-medium">Dest Tx</span>
          <span className="flex items-center gap-1 text-sm font-semibold text-gray-900">
            <a
              href={destTxUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              {midTruncate(destTxHash)}
            </a>
            <CopyButton
              text={destTxHash}
              ariaLabel="Copy Destination Transaction"
            />
          </span>
        </div>
      )}

      {state.can({ type: "RETRY" }) && (
        <button
          type="button"
          onClick={() => intentStatusActorRef.send({ type: "RETRY" })}
          className="w-full mt-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Retry
        </button>
      )}
    </div>
  )
}

export default WithdrawDockItemContent

function getStatusTitle(val: string): string {
  switch (val) {
    case "pending":
    case "checking":
    case "settled":
      return "Withdraw pending..."
    case "waitingForBridge":
    case "retryDelay":
      return "Transferring..."
    case "error":
      return "Withdraw error"
    case "success":
      return "Withdraw completed"
    case "not_valid":
      return "Withdraw failed"
    default:
      return "Withdraw"
  }
}

function renderStatusLabel(val: string): string {
  switch (val) {
    case "pending":
    case "checking":
    case "settled":
      return "Pending"
    case "waitingForBridge":
    case "retryDelay":
      return "Transferring"
    case "error":
      return "Can't get status"
    case "success":
      return "Completed"
    case "not_valid":
      return "Failed"
    default:
      return "Unknown"
  }
}

function LongRunningStatusLabel({ retryCount }: { retryCount: number }) {
  return (
    <TooltipNew>
      <TooltipNew.Trigger>
        <span className="text-sm font-semibold text-gray-500">
          Long-running bridge ({retryCount})
        </span>
      </TooltipNew.Trigger>
      <TooltipNew.Content className="max-w-56 -translate-x-8 text-center">
        This withdrawal is taking longer than usual. We've checked the progress{" "}
        {retryCount} {retryCount === 1 ? "time" : "times"} so far and will keep
        checking until it completes.
      </TooltipNew.Content>
    </TooltipNew>
  )
}
