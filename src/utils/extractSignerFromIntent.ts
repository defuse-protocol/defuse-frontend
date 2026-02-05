import type { MultiPayload } from "@defuse-protocol/contract-types"
import { MultiPayloadValidator } from "@defuse-protocol/contract-types/validate"

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
  if (result.issues) return null

  const parsed = result.value

  if (parsed.standard === "nep413") {
    return parsed.payload.message.parsed.signer_id
  }

  if (parsed.standard === "ton_connect") {
    return parsed.payload.text.parsed.signer_id
  }

  // erc191, tip191, raw_ed25519, webauthn, sep53
  return parsed.payload.parsed.signer_id
}
