export const DEPOSIT_STAGES = ["submitting", "complete"] as const
export type DepositDisplayStage = (typeof DEPOSIT_STAGES)[number]

export type DepositStage = "submitting" | "complete" | "error"

export const DEPOSIT_STAGE_LABELS: Record<DepositDisplayStage, string> = {
  submitting: "Submitting transaction",
  complete: "Complete",
}

export const DEPOSIT_STAGE_LABELS_SHORT: Record<DepositDisplayStage, string> = {
  submitting: "Submitting",
  complete: "Complete",
}
