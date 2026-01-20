export type StatusActorSnapshot = {
  value: string | object
  context: { txHash?: string | null }
  can: (event: { type: string }) => boolean
}

export const SWAP_STAGES = [
  "finding",
  "competing",
  "executing",
  "complete",
] as const
export type SwapStage = (typeof SWAP_STAGES)[number]

export const SWAP_STAGE_LABELS: Record<SwapStage, string> = {
  finding: "Finding best price",
  competing: "Solvers competing for your quote",
  executing: "Executing swap",
  complete: "Complete",
}

export const SWAP_STAGE_LABELS_SHORT: Record<SwapStage, string> = {
  finding: "Finding price",
  competing: "Solvers competing",
  executing: "Executing",
  complete: "Complete",
}

/**
 * Maps xstate machine state values to UI stages
 */
export function getStageFromState(stateValue: string): SwapStage {
  switch (stateValue) {
    case "pending":
    case "checking":
    case "intent_settling":
    case "SubmittingTxHash":
      return "finding"
    case "settled":
    case "waitingForBridge":
    case "retryDelay":
    case "waiting":
    case "polling":
      return "executing"
    case "success":
      return "complete"
    case "error":
    case "not_valid":
      return "complete"
    default:
      return "finding"
  }
}

/**
 * Checks if the state represents an error condition
 */
export function isErrorState(stateValue: string): boolean {
  return stateValue === "error" || stateValue === "not_valid"
}

/**
 * Extracts the top-level state value from xstate state
 */
export function extractStateValue(stateValue: string | object): string {
  return typeof stateValue === "string"
    ? stateValue
    : Object.keys(stateValue)[0]
}
