import { base64 } from "@scure/base"
import { Err, Ok, type Result } from "@thames/monads"
import * as v from "valibot"
import { logger } from "../../../logger"
import type { BaseTokenInfo } from "../../../types/base"
import type { MultiPayload } from "../../../types/defuse-contracts-types"
import type { IntentTokenDiffSchemaOutput } from "./schemaIntents"
import {
  MultiPayloadPlainSchema,
  type MultiPayloadSchemaOutput,
  PayloadStringSchema,
} from "./schemaMultipayload"

export type TradeTerms = {
  userId: string
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>
  deadline: string
  nonceBase64: string
  multiPayload: MultiPayload
}

export type ParseTradeTermsErr =
  | "CANNOT_PARSE_MULTIPAYLOAD"
  | "CANNOT_PARSE_PAYLOAD"
  | "NO_TOKEN_DIFF_INTENT"
  | "PAYLOAD_HAS_NO_NONCE"
  | GetPlainPayloadErr

export function parseTradeTerms(
  multiPayloadPlain: MultiPayload | object | string
): Result<TradeTerms, ParseTradeTermsErr> {
  const parseResult = v.safeParse(MultiPayloadPlainSchema, multiPayloadPlain)
  if (!parseResult.success) {
    logger.verbose("Couldn't parse multipayload", {
      multiPayloadPlain,
      issues: parseResult.issues,
    })
    return Err("CANNOT_PARSE_MULTIPAYLOAD")
  }
  const multiPayload = parseResult.output

  // We can be sure that `multiPayloadPlain` is MultiPayload, because we've just parsed it
  const multiPayloadObj: MultiPayload =
    typeof multiPayloadPlain === "string"
      ? JSON.parse(multiPayloadPlain)
      : multiPayloadPlain

  return getPlainPayload(multiPayload)
    .mapErr<ParseTradeTermsErr>((a) => a)
    .andThen<TradeTerms>((payloadPlain) => {
      const payloadParseResult = v.safeParse(PayloadStringSchema, payloadPlain)
      if (!payloadParseResult.success) {
        logger.verbose("Couldn't parse payload", {
          payloadPlain,
          issues: payloadParseResult,
        })
        return Err("CANNOT_PARSE_PAYLOAD")
      }
      const payload = payloadParseResult.output

      const intent = payload.intents.find(
        (intent): intent is IntentTokenDiffSchemaOutput =>
          intent.intent === "token_diff"
      )

      if (intent === undefined) {
        return Err("NO_TOKEN_DIFF_INTENT")
      }

      const nonce =
        multiPayload.standard === "nep413"
          ? multiPayload.payload.nonce
          : "nonce" in payload
            ? payload.nonce
            : null

      if (nonce == null) {
        return Err("PAYLOAD_HAS_NO_NONCE")
      }

      return Ok({
        userId: payload.signer_id,
        tokenDiff: intent.diff,
        deadline: payload.deadline,
        nonceBase64: base64.encode(nonce),
        multiPayload: multiPayloadObj,
      })
    })
}

type GetPlainPayloadErr = "UNSUPPORTED_PAYLOAD_STANDARD"

function getPlainPayload(
  payload: MultiPayloadSchemaOutput
): Result<string, GetPlainPayloadErr> {
  const payloadStandard = payload.standard

  switch (payloadStandard) {
    case "nep413":
      return Ok(payload.payload.message)
    case "erc191":
    case "raw_ed25519":
    case "webauthn":
      return Ok(payload.payload)
    default:
      payloadStandard satisfies never
      return Err("UNSUPPORTED_PAYLOAD_STANDARD")
  }
}
