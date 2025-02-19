import { base58 } from "@scure/base"
import { sign } from "tweetnacl"
import { verifyMessage as verifyMessageViem } from "viem"

import { createEmptyIntentMessage } from "@defuse-protocol/defuse-sdk"
import type { ChainType } from "@src/hooks/useConnectWallet"
import type {
  WalletMessage,
  WalletSignatureResult,
} from "@src/types/walletMessages"

export async function verifyWalletSignature<T>(
  signature: WalletSignatureResult<T>,
  userAddress: string
) {
  if (signature == null) return false

  const signatureType = signature.type
  switch (signatureType) {
    case "NEP413":
      return (
        // For NEP-413, it's enough to ensure user didn't switch the account
        signature.signatureData.accountId === userAddress
      )
    case "ERC191": {
      return verifyMessageViem({
        address: userAddress as "0x${string}",
        message: signature.signedData.message,
        signature: signature.signatureData as "0x${string}",
      })
    }
    case "SOLANA": {
      return sign.detached.verify(
        signature.signedData.message,
        signature.signatureData,
        base58.decode(userAddress)
      )
    }
    case "WEBAUTHN": {
      // todo: do we need to verify webauthn signatures?
      return true
    }
    default:
      signatureType satisfies never
      throw new Error("exhaustive check failed")
  }
}

export function walletVerificationMessageFactory(
  credential: string,
  credentialType: ChainType
): WalletMessage<unknown> {
  return createEmptyIntentMessage({
    signerId: { credential, credentialType },
  })
}
