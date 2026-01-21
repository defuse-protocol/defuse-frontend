import Alert from "@src/components/Alert"
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
        "Your transaction confirmation was either cancelled, or failed. If it failed, you can try again, or contact support."
      break

    case "ERR_CANNOT_VERIFY_SIGNATURE":
      content =
        "We couldn’t verify your authentication. Please try again, and contact support if this continues."
      break

    case "ERR_SIGNED_DIFFERENT_ACCOUNT":
      content =
        "We couldn’t verify that authentication. Please double-check that you’re not signing with the wrong wallet, and try again, or contact support if this continues."
      break

    case "ERR_PUBKEY_ADDING_DECLINED":
      content = null
      break

    case "ERR_PUBKEY_CHECK_FAILED":
      content =
        "We couldn’t verify your ’public key’, a tech problem likely caused by a network issue. Please try again, and contact support if this continues."
      break

    case "ERR_PUBKEY_ADDING_FAILED":
      content =
        "We couldn’t add your ’public key’, a tech problem likely caused by a network issue. Please try again, and contact support if this continues."
      break

    case "ERR_PUBKEY_EXCEPTION":
      content =
        "We couldn’t add your ’public key’, a tech problem likely caused by a network issue. Please try again, and contact support if this continues."
      break

    case "ERR_QUOTE_EXPIRED_RETURN_IS_LOWER":
      content = "Your quote unfortunately expired. Please try again."
      break

    case "ERR_CANNOT_PUBLISH_INTENT":
      content =
        "We couldn’t process your request, likely caused by a network issue. Please try again, and contact support if this continues."
      break

    case "ERR_WALLET_POPUP_BLOCKED":
      content = "Please enable pop-up windows in your browser, and try again."
      break

    case "ERR_WALLET_CANCEL_ACTION":
      content = null
      break

    case "ERR_1CS_QUOTE_FAILED":
      content = "Failed to get quote"
      break

    case "ERR_NO_DEPOSIT_ADDRESS":
      content = "No deposit address in the quote"
      break

    case "ERR_TRANSFER_MESSAGE_FAILED":
      content =
        "We were unable to create a ’transfer message’, a tech problem on our side. Please try again, and contact support if this continues."
      break

    case "ERR_AMOUNT_IN_BALANCE_INSUFFICIENT_AFTER_NEW_1CS_QUOTE":
      content =
        "While processing your swap, the price quote updated to an amount that exceeds the balance in your account. Pleaes try again, and contact support if this continues."
      break

    default:
      status satisfies never
      content = `An error occurred. Please try again, and contact support and include this status data: ${status}`
  }

  if (content == null) {
    return null
  }

  return (
    <Alert variant="error" className="mt-2">
      {content}
    </Alert>
  )
}

export default IntentCreationResult
