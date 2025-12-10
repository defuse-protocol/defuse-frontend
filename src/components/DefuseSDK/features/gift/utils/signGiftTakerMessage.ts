import { VersionedNonceBuilder } from "@defuse-protocol/intents-sdk"
import { authIdentity, messageFactory } from "@defuse-protocol/internal-utils"
import type { walletMessage } from "@defuse-protocol/internal-utils"
import { base64 } from "@scure/base"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { minutesFromNow } from "@src/components/DefuseSDK/core/messages"
import { salt } from "@src/components/DefuseSDK/services/intentsContractService"
import { KeyPair } from "near-api-js"
import type { IntentsUserId, SignerCredentials } from "../../../core/formatters"
import { formatUserIdentity } from "../../../core/formatters"
import type { GiftInfo } from "../actors/shared/getGiftInfo"
import { hashing } from "./hashing"

type GiftTakerMessage = {
  giftInfo: GiftInfo
  signerCredentials: SignerCredentials
}

export async function signGiftTakerMessage({
  giftInfo,
  signerCredentials,
}: GiftTakerMessage): Promise<walletMessage.NEP413SignatureData> {
  const walletMessage = await assembleWalletMessage({
    giftInfo,
    signerCredentials,
  })
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

async function assembleWalletMessage({
  giftInfo,
  signerCredentials,
}: GiftTakerMessage) {
  const deadline = minutesFromNow(5)
  const nonce = base64.decode(
    VersionedNonceBuilder.encodeNonce(
      await salt({ nearClient }),
      new Date(deadline)
    )
  )

  // Signer should be with `near` credential type as we use ED25519 signing
  const signerId = resolveSignerId(
    authIdentity.authHandleToIntentsUserId(giftInfo.accountId, "near")
  )

  const innerMessage = messageFactory.makeInnerTransferMessage({
    tokenDeltas: [...Object.entries(giftInfo.tokenDiff)],
    signerId,
    deadlineTimestamp: deadline,
    receiverId: authIdentity.authHandleToIntentsUserId(
      signerCredentials.credential,
      signerCredentials.credentialType
    ),
  })
  return messageFactory.makeSwapMessage({
    innerMessage,
    nonce: nonce,
  })
}

function resolveSignerId(
  signerId: IntentsUserId | SignerCredentials
): IntentsUserId {
  return typeof signerId === "string" ? signerId : formatUserIdentity(signerId)
}
