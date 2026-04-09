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

export type SerializedResult<T, E> = { ok: T } | { err: E }

/** Plain error shape returned by server actions (only `code` survives serialization). */
export type SerializedPublishError = { code: string }

export function mapPublishError(
  error: SerializedPublishError
): ParsedPublishErrors {
  const errorCode = error.code

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

  return reason === "RELAY_PUBLISH_UNKNOWN_ERROR"
    ? { reason, serverReason: errorCode }
    : { reason }
}

/**
 * Adapter that converts server action's serialized Result into legacy format.
 */
export function convertPublishIntentToLegacyFormat(
  result: SerializedResult<string, SerializedPublishError>
): { tag: "ok"; value: string } | { tag: "err"; value: ParsedPublishErrors } {
  if ("ok" in result) {
    return { tag: "ok", value: result.ok }
  }
  return { tag: "err", value: mapPublishError(result.err) }
}
