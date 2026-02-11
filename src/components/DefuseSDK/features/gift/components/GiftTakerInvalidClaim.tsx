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
    <>
      <h1 className="text-2xl/7 md:text-4xl/10 text-balance font-bold tracking-tight">
        {config.title}
      </h1>

      <div className="mt-4">
        {config.descriptions.map((description) => (
          <p
            key={description}
            className="text-gray-500 text-base font-medium mt-1"
          >
            {description}
          </p>
        ))}
      </div>

      {errorType === "unknown" && (
        <Alert variant="error" className="mt-5 inline-flex">
          {error}
        </Alert>
      )}
    </>
  )
}
