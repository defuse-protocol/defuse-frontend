import type {
  Intent,
  MultiPayload,
} from "@src/components/DefuseSDK/types/defuse-contracts-types"
import { safeParse } from "valibot"
import { logger } from "../../../logger"
import { MultiPayloadDeepSchema } from "../../otcDesk/utils/schemaMultipayload"

type TransferIntentSubset = {
  intent: "transfer"
  receiver_id: string
  tokens: {
    [k: string]: string
  }
}

export function parseMultiPayloadTransferMessage(
  multiPayload: MultiPayload
): null | TransferIntentSubset {
  const result = safeParse(MultiPayloadDeepSchema, multiPayload)
  if (!result.success) {
    logger.error(result.issues)
    return null
  }
  const standard = result.output.standard
  switch (standard) {
    case "nep413": {
      const intents = result.output.payload.message.intents as Intent[]
      if (intents.length === 0) {
        return null
      }
      const firstIntent = intents[0]
      if (firstIntent && isTransferIntent(firstIntent)) {
        return firstIntent
      }
      return null
    }
    case "erc191":
    case "raw_ed25519":
    case "webauthn": {
      const intents = result.output.payload.intents as Intent[]
      if (intents.length === 0) {
        return null
      }
      const firstIntent = intents[0]
      if (firstIntent && isTransferIntent(firstIntent)) {
        return firstIntent
      }
      return null
    }
    default:
      standard satisfies never
      throw new Error("Unsupported multi payload standard")
  }
}

function isTransferIntent(intent: Intent): intent is TransferIntentSubset {
  return (
    intent.intent === "transfer" &&
    "receiver_id" in intent &&
    "tokens" in intent
  )
}

export function getTokenDiffFromTransferMessage(
  message: TransferIntentSubset
): null | Record<string, bigint> {
  if (message.intent !== "transfer") {
    return null
  }

  return Object.fromEntries(
    Object.entries(message.tokens).map(([token, amount]) => [
      token,
      BigInt(amount),
    ])
  )
}
