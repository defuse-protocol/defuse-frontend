import { XCircleIcon } from "@heroicons/react/20/solid"
import type { ReactNode } from "react"
import type { Context } from "../../machines/swapUIMachine"

const IntentCreationResult = ({
  intentCreationResult,
}: { intentCreationResult: Context["intentCreationResult"] }) => {
  if (!intentCreationResult || intentCreationResult.tag === "ok") {
    return null
  }

  let content: ReactNode = null

  const status = intentCreationResult.value.reason

  switch (status) {
    case "ERR_USER_DIDNT_SIGN":
      content =
        "It seems the message wasn’t signed in your wallet. Please try again."
      break

    case "ERR_CANNOT_VERIFY_SIGNATURE":
      content =
        "We couldn’t verify your signature, please try again with another wallet."
      break

    case "ERR_SIGNED_DIFFERENT_ACCOUNT":
      content =
        "The message was signed with a different wallet. Please try again."
      break

    case "ERR_PUBKEY_ADDING_DECLINED":
      content = null
      break

    case "ERR_PUBKEY_CHECK_FAILED":
      content =
        "We couldn’t verify your key, possibly due to a connection issue."
      break

    case "ERR_PUBKEY_ADDING_FAILED":
      content = "Transaction for adding public key is failed. Please try again."
      break

    case "ERR_PUBKEY_EXCEPTION":
      content = "An error occurred while adding public key. Please try again."
      break

    case "ERR_QUOTE_EXPIRED_RETURN_IS_LOWER":
      content =
        "The quote has expired or the return is lower than expected. Please try again."
      break

    case "ERR_CANNOT_PUBLISH_INTENT":
      content =
        "We couldn’t send your request, possibly due to a network issue or server downtime. Please check your connection or try again later."
      break

    case "ERR_WALLET_POPUP_BLOCKED":
      content = "Please allow popups and try again."
      break

    case "ERR_WALLET_CANCEL_ACTION":
      content = null
      break

    case "ERR_1CS_QUOTE_FAILED":
      content = "Failed to get quote. Please try again."
      break

    case "ERR_NO_DEPOSIT_ADDRESS":
      content = "No deposit address in the quote"
      break

    case "ERR_TRANSFER_MESSAGE_FAILED":
      content = "Failed to create transfer message. Please try again."
      break

    case "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE":
      content =
        "Swap aborted: Insufficient token balance for the updated quote. Please try again."
      break

    default:
      status satisfies never
      content = `An error occurred. Please try again. ${status}`
  }

  if (content == null) {
    return null
  }

  return (
    <div className="mt-2 bg-red-50 pl-3 pr-6 py-3 rounded-2xl flex items-start gap-3">
      <XCircleIcon className="size-5 shrink-0 text-red-600" aria-hidden />
      <p className="text-sm font-medium text-red-700">{content}</p>
    </div>
  )
}

export default IntentCreationResult
