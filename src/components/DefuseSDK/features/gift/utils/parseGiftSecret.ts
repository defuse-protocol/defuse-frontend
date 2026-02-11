import { Err, Ok, type Result } from "@thames/monads"
import * as v from "valibot"
import {
  type EscrowCredentials,
  parseEscrowCredentials,
} from "./generateEscrowCredentials"

export type GiftSecretError = { reason: "INVALID_SECRET_KEY" }

export type ParsedGiftSecret = {
  escrowCredentials: EscrowCredentials
  message: string
}

const GiftSecretSchema = v.object({
  secretKey: v.string(),
  message: v.string(),
})

export function parseGiftSecret(
  payload: unknown
): Result<ParsedGiftSecret, GiftSecretError> {
  try {
    const parseResult = v.safeParse(GiftSecretSchema, payload)
    if (!parseResult.success) {
      return Err({ reason: "INVALID_SECRET_KEY" })
    }

    const escrowCredentials = parseEscrowCredentials(
      parseResult.output.secretKey
    )
    const message = parseResult.output.message

    return Ok({
      escrowCredentials,
      message,
    })
  } catch {
    return Err({ reason: "INVALID_SECRET_KEY" })
  }
}
