import { WarningCircleIcon } from "@phosphor-icons/react"

type ErrorReasonProps = {
  reason: string
}

export function ErrorReason({ reason }: ErrorReasonProps) {
  return (
    <div className="p-3 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
      <div className="size-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
        <WarningCircleIcon weight="fill" className="size-4 text-red-600" />
      </div>
      <p className="text-sm text-red-700 font-medium pt-1">
        {renderErrorMessages(reason)}
      </p>
    </div>
  )
}

function renderErrorMessages(reason: string): string {
  switch (reason) {
    case "RELAY_PUBLISH_INSUFFICIENT_BALANCE":
      return "This gift has already been claimed by someone else. Please try another gift or create a new one."

    case "ERR_STORAGE_OPERATION_EXCEPTION":
    case "EXCEPTION":
      return "Something went wrong while creating the gift link. Please check your internet connection or try again shortly."

    case "ERR_SET_ITEM_FAILED_TO_STORAGE":
      return "Unable to save your gift. Please try again in a moment."

    case "ERR_UPDATE_ITEM_FAILED_TO_STORAGE":
      return "Unable to update your gift. Please try again in a moment."

    case "ERR_REMOVE_ITEM_FAILED_FROM_STORAGE":
      return "Unable to remove your gift. Please try again in a moment."

    case "ERR_GIFT_PUBLISHING":
      return "Unable to publish your gift. Please try again in a moment."

    case "ERR_GIFT_SIGNING":
      return "Unable to sign your gift. Please try again in a moment."
    case "ERR_PREPARING_GIFT_SIGNING_DATA":
      return "Failed to prepare message for your wallet to sign. Please try again."
    case "SETTLEMENT_FAILED":
      return "Gift claim is taking longer than expected. Please try again."
    case "NOT_FOUND_OR_NOT_VALID":
    case "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED":
      return "This gift is no longer available. It may have been claimed by someone else or the link is invalid. Please contact the gift creator for assistance."

    case "INVALID_SECRET_KEY":
      return "This gift link is invalid. Please contact the gift creator for assistance."
    case "ERR_USER_DIDNT_SIGN":
      return "It seems the message wasn’t signed in your wallet. Please try again."
    default:
      return reason
  }
}
