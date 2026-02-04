import { XMarkIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"

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
        title: "Gift unavailable",
        descriptions: [
          "This gift is no longer available.",
          "It may have been claimed or cancelled by the sender.",
        ],
      }
    case "invalid":
      return {
        title: "Invalid gift link",
        descriptions: [
          "This gift link is invalid or has been corrupted.",
          "Double-check the link or ask the sender to share it again.",
        ],
      }
    default:
      return {
        title: "Something went wrong",
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
    <div className="relative overflow-hidden p-5 pt-12 flex flex-col items-center justify-center bg-white rounded-3xl border border-gray-200 mt-7">
      <div className="absolute top-0 inset-x-0 h-32 bg-linear-to-b from-red-50 to-red-50/0" />

      <div className="relative flex flex-col items-center justify-center">
        <div className="flex items-center justify-center rounded-full bg-red-100 size-13 shrink-0">
          <XMarkIcon className="size-6 text-red-600" />
        </div>
        <h1 className="mt-5 text-2xl/7 font-bold text-gray-900 tracking-tight">
          {config.title}
        </h1>
        <div className="mt-4">
          {config.descriptions.map((description) => (
            <p
              key={description}
              className="text-gray-500 text-sm font-medium text-center mt-1"
            >
              {description}
            </p>
          ))}
        </div>
      </div>
      {errorType === "unknown" && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}
    </div>
  )
}
