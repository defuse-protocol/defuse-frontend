import Alert from "@src/components/Alert"
import type { ReactNode } from "react"
import type { Context } from "../../machines/depositUIMachine"

export type DepositWarningOutput =
  | Context["depositOutput"]
  | Context["preparationOutput"]

export const DepositWarning = ({
  depositWarning,
  className,
  tokenSymbol,
  networkLabel,
}: {
  depositWarning: DepositWarningOutput
  className?: string
  tokenSymbol?: string
  networkLabel?: string
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
        if (tokenSymbol && networkLabel) {
          content = `We couldn't retrieve a balance from your wallet for ${tokenSymbol} on ${networkLabel}. This is likely because your wallet doesn't support ${networkLabel}, but could also happen if there's a network issue.`
        } else {
          content =
            "We couldn't retrieve a balance from your wallet. This is likely because your wallet doesn't support the selected network, but could also happen if there's a network issue."
        }
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
    <Alert variant="error" className={className}>
      {content}
    </Alert>
  )
}
