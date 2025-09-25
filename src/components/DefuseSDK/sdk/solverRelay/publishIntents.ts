import type { solverRelay } from "@defuse-protocol/internal-utils"
import { Err, Ok, type Result } from "@thames/monads"
import type { ParsedPublishErrors } from "./utils/parseFailedPublishError"

export type PublishIntentsOk = string[]
export type PublishIntentsErr =
  | ParsedPublishErrors
  | { reason: "RELAY_PUBLISH_NETWORK_ERROR" }

export function convertPublishIntentsToLegacyFormat(
  result: Result<
    solverRelay.PublishIntentsReturnType,
    solverRelay.PublishIntentsErrorType
  >
): Promise<Result<PublishIntentsOk, PublishIntentsErr>> {
  if (result.isOk()) {
    return Promise.resolve(Ok(result.unwrap()))
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
    default:
      reason = "RELAY_PUBLISH_UNKNOWN_ERROR"
  }

  return Promise.resolve(
    Err({
      reason,
      serverReason: errorCode,
    })
  )
}
