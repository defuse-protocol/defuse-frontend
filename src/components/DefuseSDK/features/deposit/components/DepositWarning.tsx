import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Callout } from "@radix-ui/themes"
import type { ReactNode } from "react"
import type { Context } from "../../machines/depositUIMachine"

export const DepositWarning = ({
  depositWarning,
}: {
  depositWarning: Context["depositOutput"] | Context["preparationOutput"]
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
      case "ERR_PREPARING_DEPOSIT":
        content =
          "It seems the deposit preparation is failed. Please try again."
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
    <Callout.Root size="1" color="red">
      <Callout.Icon>
        <ExclamationTriangleIcon />
      </Callout.Icon>
      <Callout.Text>{content}</Callout.Text>
    </Callout.Root>
  )
}
