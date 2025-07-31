import { assert } from "../../../utils/assert"
import type { GiftMakerRootMachineContext } from "../actors/giftMakerRootMachine"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import type { GiftSignedResult } from "../types/sharedTypes"
import {
  getTokenDiffFromTransferMessage,
  parseMultiPayloadTransferMessage,
} from "./parseMultiPayload"

type ReadyGiftInfo = GiftInfo & {
  intentHashes: string[]
}

export function assembleGiftInfo(
  context: GiftMakerRootMachineContext
): ReadyGiftInfo {
  const signData = context.signData
  const parsedValues = getParsedValues(context)

  assert(signData, "signData is not defined")
  assert(parsedValues.token, "token is not defined")
  assert(parsedValues.amount, "amount is not defined")
  assert(context.escrowCredentials != null)

  return {
    // `intentHashes` is initially undefined when storing giftInfo to history before publishing.
    // The actual intentHashes will be populated after successful publishing.
    intentHashes: context?.intentHashes ?? [],
    tokenDiff: getTokenDiff(signData),
    token: parsedValues.token,
    secretKey: context.escrowCredentials.secretKey,
    accountId: context.escrowCredentials.credential,
    message: parsedValues.message,
  }
}

export function getParsedValues(context: GiftMakerRootMachineContext) {
  const form = context.formRef.getSnapshot()
  const parsedValuesSnapshot = form.context.parsedValues.getSnapshot()
  const parsedValues = parsedValuesSnapshot.context
  assert(
    parsedValues.token !== null && parsedValues.amount !== null,
    "token and amount are not defined"
  )
  return parsedValues
}

function getTokenDiff(signData: GiftSignedResult) {
  const parsed = parseMultiPayloadTransferMessage(signData.multiPayload)
  assert(parsed !== null, "Invalid parsed multiPayload")

  const tokenDiff = getTokenDiffFromTransferMessage(parsed)
  assert(tokenDiff !== null, "Invalid token diff")

  return tokenDiff
}
