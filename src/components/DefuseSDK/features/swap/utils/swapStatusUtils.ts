export type StatusActorSnapshot = {
  value: string | object
  context: {
    txHash?: string | null
    status?: string | null
  }
  can: (event: { type: string }) => boolean
}

export const SWAP_STAGES = ["pending", "executing", "complete"] as const
export type SwapStage = (typeof SWAP_STAGES)[number]

export const SWAP_STAGE_LABELS: Record<SwapStage, string> = {
  pending: "Finding best price",
  executing: "Executing swap",
  complete: "Complete",
}

export const SWAP_STAGE_LABELS_SHORT: Record<SwapStage, string> = {
  pending: "Finding",
  executing: "Executing",
  complete: "Complete",
}

export function getStageFromState(stateValue: string): SwapStage {
  switch (stateValue) {
    case "pending":
    case "checking":
    case "intent_settling":
    case "SubmittingTxHash":
      return "pending"
    case "settled":
    case "waitingForBridge":
    case "retryDelay":
    case "waiting":
    case "polling":
      return "executing"
    case "success":
    case "error":
    case "not_valid":
      return "complete"
    default:
      return "pending"
  }
}

export function extractStateValue(stateValue: string | object): string {
  return typeof stateValue === "string"
    ? stateValue
    : Object.keys(stateValue)[0]
}

export function is1csError(status: string | null | undefined): boolean {
  return status === "FAILED" || status === "REFUNDED"
}

export function is1csSuccess(status: string | null | undefined): boolean {
  return status === "SUCCESS"
}

export function isIntentError(stateValue: string): boolean {
  return stateValue === "error" || stateValue === "not_valid"
}

export function isIntentSuccess(stateValue: string): boolean {
  return stateValue === "success"
}
