import { base64 } from "@scure/base"
import { authHandleToIntentsUserId } from "@src/components/DefuseSDK/utils/authIdentity"
import { KeyPair } from "near-api-js"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { formatUserIdentity } from "../../../core/formatters"
import type { NEP413SignatureData } from "../../../types/walletMessage"
import {
  makeInnerTransferMessage,
  makeSwapMessage,
} from "../../../utils/messageFactory"
import { randomDefuseNonce } from "../../../utils/messageFactory"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import { hashing } from "./hashing"

type GiftTakerMessage = {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
}

export async function signGiftTakerMessage({
  giftInfo,
  signerCredentials,
}: GiftTakerMessage): Promise<NEP413SignatureData> {
  const walletMessage = assembleWalletMessage({ giftInfo, signerCredentials })
  const keyPair = KeyPair.fromString(giftInfo.secretKey)

  // Claimed message should be NEP-413 within same standard as escrow account
  const messageHash = await hashing({
    ...walletMessage.NEP413,
  })

  const signature = keyPair.sign(messageHash)

  return {
    type: "NEP413",
    signatureData: {
      accountId: giftInfo.accountId,
      publicKey: keyPair.getPublicKey().toString(),
      signature: base64.encode(signature.signature),
    },
    signedData: walletMessage.NEP413,
  }
}

function assembleWalletMessage({
  giftInfo,
  signerCredentials,
}: GiftTakerMessage) {
  const nonce = randomDefuseNonce()

  // Signer should be with `near` credential type as we use ED25519 signing
  const signerId = resolveSignerId(
    authHandleToIntentsUserId(giftInfo.accountId, "near")
  )

  const innerMessage = makeInnerTransferMessage({
    tokenDeltas: [...Object.entries(giftInfo.tokenDiff)],
    signerId,
    deadlineTimestamp: minutesFromNow(5),
    receiverId: authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    ),
  })
  return makeSwapMessage({
    innerMessage,
    nonce: nonce,
  })
}

function minutesFromNow(minutes: number): number {
  return Date.now() + minutes * 60 * 1000
}

function resolveSignerId(
  signerId: IntentsUserId | SignerCredentials
): IntentsUserId {
  return typeof signerId === "string" ? signerId : formatUserIdentity(signerId)
}
