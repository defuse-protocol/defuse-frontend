import { GiftIcon, WarningCircleIcon, XCircleIcon } from "@phosphor-icons/react"
import { GiftDescription } from "./shared/GiftDescription"
import { GiftHeader } from "./shared/GiftHeader"

type ErrorType = "claimed" | "invalid" | "unknown"

function getErrorType(error: string): ErrorType {
  if (error === "NO_TOKEN_OR_GIFT_HAS_BEEN_CLAIMED") return "claimed"
  if (error === "INVALID_PAYLOAD" || error === "INVALID_SECRET")
    return "invalid"
  return "unknown"
}

function getErrorConfig(errorType: ErrorType) {
  switch (errorType) {
    case "claimed":
      return {
        title: "Gift Unavailable",
        icon: (
          <div className="size-16 rounded-full bg-gray-100 flex items-center justify-center">
            <GiftIcon weight="fill" className="size-8 text-gray-500" />
          </div>
        ),
        descriptions: [
          "This gift is no longer available.",
          "It may have been claimed or cancelled by the sender.",
        ],
      }
    case "invalid":
      return {
        title: "Invalid Gift Link",
        icon: (
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircleIcon weight="fill" className="size-8 text-red-600" />
          </div>
        ),
        descriptions: [
          "This gift link is invalid or has been corrupted.",
          "Double-check the link or ask the sender to share it again.",
        ],
      }
    default:
      return {
        title: "Something Went Wrong",
        icon: (
          <div className="size-16 rounded-full bg-red-100 flex items-center justify-center">
            <WarningCircleIcon weight="fill" className="size-8 text-red-600" />
          </div>
        ),
        descriptions: [
          "We couldn't process this gift right now.",
          "Please try again later or contact support if the issue persists.",
        ],
      }
  }
}

type GiftTakerInvalidClaimProps = {
  error: string
}

export function GiftTakerInvalidClaim({ error }: GiftTakerInvalidClaimProps) {
  const errorType = getErrorType(error)
  const config = getErrorConfig(errorType)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GiftHeader title={config.title} icon={config.icon}>
        {config.descriptions.map((desc) => (
          <GiftDescription key={desc} description={desc} />
        ))}
      </GiftHeader>

      {errorType === "unknown" && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-100 p-4">
          <div className="text-sm text-red-700 font-medium">Error details</div>
          <div className="text-sm text-red-600 mt-1 font-mono">{error}</div>
        </div>
      )}
    </div>
  )
}
