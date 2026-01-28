export {
  type StatusActorSnapshot,
  extractStateValue,
} from "@src/components/DefuseSDK/features/common/statusUtils"

export const WITHDRAW_STAGES = ["pending", "executing", "complete"] as const
export type WithdrawStage = (typeof WITHDRAW_STAGES)[number]

export const WITHDRAW_STAGE_LABELS: Record<WithdrawStage, string> = {
  pending: "Processing withdrawal",
  executing: "Transferring funds",
  complete: "Complete",
}

export const WITHDRAW_STAGE_LABELS_SHORT: Record<WithdrawStage, string> = {
  pending: "Processing",
  executing: "Transferring",
  complete: "Complete",
}

export function getStageFromState(stateValue: string): WithdrawStage {
  switch (stateValue) {
    case "pending":
    case "checking":
      return "pending"
    case "settled":
    case "waitingForBridge":
    case "retryDelay":
      return "executing"
    case "success":
    case "error":
    case "not_valid":
      return "complete"
    default:
      return "pending"
  }
}

export function isWithdrawError(stateValue: string): boolean {
  return stateValue === "error" || stateValue === "not_valid"
}

export function isWithdrawSuccess(stateValue: string): boolean {
  return stateValue === "success"
}
