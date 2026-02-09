import type { MultiPayload } from "@defuse-protocol/contract-types"
import { MultiPayloadValidator } from "@defuse-protocol/contract-types/validate"

/**
 * Parses a raw JSON payload string and extracts the signer_id field.
 * Returns null if parsing fails or signer_id is absent.
 */
function parsePayloadSignerId(payload: string): string | null {
  try {
    const parsed = JSON.parse(payload) as { signer_id?: string }
    return parsed.signer_id ?? null
  } catch {
    return null
  }
}

/**
 * Extracts the signer_id from a signed intent's message payload.
 * Uses the official validator to parse the payload structure.
 * Returns null if the signer cannot be extracted or validation fails.
 */
export function extractSignerFromIntent(
  signedIntent: MultiPayload
): string | null {
  const result = MultiPayloadValidator.validate(signedIntent)

  if (result instanceof Promise) return null

  // tip191 (Tron) and sep53 (Stellar): validator may fail schema; payload is the raw message string
  if (result.issues && "standard" in signedIntent) {
    const standard = signedIntent.standard
    if (
      (standard === "tip191" || standard === "sep53") &&
      typeof signedIntent.payload === "string"
    ) {
      return parsePayloadSignerId(signedIntent.payload)
    }
  }
  if (result.issues) return null

  const parsed = result.value

  if (parsed.standard === "nep413") {
    return parsed.payload.message.parsed.signer_id
  }

  if (parsed.standard === "ton_connect") {
    return parsed.payload.text.parsed.signer_id
  }

  // erc191 and tip191: payload can be a string (raw message) or { original, parsed }
  const payload = parsed.payload as
    | string
    | { original?: string; parsed?: { signer_id?: string } }
  if (typeof payload === "string") return parsePayloadSignerId(payload)
  return payload?.parsed?.signer_id ?? null
}
