import type { ReactNode } from "react"
import type { Context } from "../../machines/depositUIMachine"

import { XCircleIcon } from "@heroicons/react/20/solid"
import ErrorMessage from "@src/components/ErrorMessage"

export type DepositWarningOutput =
  | Context["depositOutput"]
  | Context["preparationOutput"]

export const DepositWarning = ({
  depositWarning,
}: {
  depositWarning: DepositWarningOutput
}) => {
  let content: ReactNode = null

  if (depositWarning?.tag === "err") {
    // Check if the errorResult has a 'reason' property
    const status =
      "reason" in depositWarning.value
        ? depositWarning.value.reason
        : "An error occurred. Please try again."

    switch (status) {
      case "ERR_SUBMITTING_TRANSACTION":
        content =
          "It seems the transaction was rejected in your wallet. Please try again."
        break
      case "ERR_GENERATING_ADDRESS":
        content =
          "It seems the deposit address was not generated. Please try re-selecting the token and network."
        break
      case "ERR_FETCH_BALANCE":
        content = "It seems the balance is not available. Please try again."
        break
      case "ERR_NEP141_STORAGE_CANNOT_FETCH":
        content =
          "It seems the storage deposit check is failed. Please try again."
        break
      case "ERR_ESTIMATE_MAX_DEPOSIT_VALUE":
        content =
          "It seems the max deposit value is not calculated. Please try again."
        break
      case "ERR_DEPOSIT_PARAMS_INVALID":
        content = "It seems the deposit params are invalid. Please try again."
        break
      default:
        content = "An error occurred. Please try again."
    }
  }

  if (!content) {
    return null
  }

  return (
    <div className="bg-red-50 pl-3 pr-6 py-3 rounded-2xl flex items-start gap-3">
      <XCircleIcon className="size-5 shrink-0 text-red-600" aria-hidden />
      <ErrorMessage>{content}</ErrorMessage>
    </div>
  )
}
