import type { solverRelay } from "@defuse-protocol/internal-utils"
import type { Result } from "@thames/monads"

export type ParsedPublishErrors =
  | {
      reason:
        | "RELAY_PUBLISH_SIGNATURE_EXPIRED"
        | "RELAY_PUBLISH_INTERNAL_ERROR"
        | "RELAY_PUBLISH_SIGNATURE_INVALID"
        | "RELAY_PUBLISH_NONCE_USED"
        | "RELAY_PUBLISH_INSUFFICIENT_BALANCE"
        | "RELAY_PUBLISH_PUBLIC_NOT_EXIST"
    }
  | {
      reason: "RELAY_PUBLISH_UNKNOWN_ERROR"
      serverReason: string
    }

/**
 * Adapter function that converts the new Result<string, PublishIntentsErrorType>
 * from internal-utils into the legacy format used by the SDK.
 */
export function convertPublishIntentToLegacyFormat(
  result: Result<string, solverRelay.PublishIntentsErrorType>
):
  | { tag: "ok"; value: string }
  | {
      tag: "err"
      value: ParsedPublishErrors
    } {
  if (result.isOk()) {
    return { tag: "ok", value: result.unwrap() }
  }

  const error = result.unwrapErr()
  const errorCode = error.code

  // Map new PublishErrorCode to old ParsedPublishErrors format
  let reason: ParsedPublishErrors["reason"]
  switch (errorCode) {
    case "SIGNATURE_EXPIRED":
      reason = "RELAY_PUBLISH_SIGNATURE_EXPIRED"
      break
    case "INTERNAL_ERROR":
      reason = "RELAY_PUBLISH_INTERNAL_ERROR"
      break
    case "SIGNATURE_INVALID":
      reason = "RELAY_PUBLISH_SIGNATURE_INVALID"
      break
    case "NONCE_USED":
      reason = "RELAY_PUBLISH_NONCE_USED"
      break
    case "INSUFFICIENT_BALANCE":
      reason = "RELAY_PUBLISH_INSUFFICIENT_BALANCE"
      break
    case "PUBLIC_KEY_NOT_EXIST":
      reason = "RELAY_PUBLISH_PUBLIC_NOT_EXIST"
      break
    case "UNKNOWN_ERROR":
      reason = "RELAY_PUBLISH_UNKNOWN_ERROR"
      break
    case "NETWORK_ERROR":
      reason = "RELAY_PUBLISH_UNKNOWN_ERROR"
      break
    default:
      reason = "RELAY_PUBLISH_UNKNOWN_ERROR"
  }

  return {
    tag: "err",
    value:
      reason === "RELAY_PUBLISH_UNKNOWN_ERROR"
        ? { reason, serverReason: errorCode }
        : { reason },
  }
}
