export const DEPOSIT_STAGES = [
  "submitting",
  "confirming",
  "complete",
  "error",
] as const
export type DepositStage = (typeof DEPOSIT_STAGES)[number]

export const DEPOSIT_STAGE_LABELS: Record<DepositStage, string> = {
  submitting: "Submitting transaction",
  confirming: "Confirming on chain",
  complete: "Complete",
  error: "Failed",
}

export const DEPOSIT_STAGE_LABELS_SHORT: Record<DepositStage, string> = {
  submitting: "Submitting",
  confirming: "Confirming",
  complete: "Complete",
  error: "Failed",
}
