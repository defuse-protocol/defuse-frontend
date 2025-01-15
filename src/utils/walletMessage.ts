import { base58 } from "@scure/base"
import { sign } from "tweetnacl"
import { verifyMessage as verifyMessageViem } from "viem"

import type {
  WalletMessage,
  WalletSignatureResult,
} from "@src/types/walletMessages"

export async function verifyWalletSignature(
  signature: WalletSignatureResult,
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
    default:
      signatureType satisfies never
      throw new Error("exhaustive check failed")
  }
}

export function walletVerificationMessageFactory(
  address: string
): WalletMessage {
  const timestamp = Date.now()

  // Generate a secure nonce for NEP-413
  const nonce = crypto.getRandomValues(new Uint8Array(32))

  const baseMessage = `Welcome! To keep your account secure, please verify your wallet.

Wallet: ${address}
Time: ${new Date(timestamp).toLocaleString()}

By signing this message, you're confirming that you own this wallet.`

  // For Solana, we'll create a UTF-8 encoded message
  const solanaMessage = new TextEncoder().encode(baseMessage)

  return {
    ERC191: {
      message: baseMessage,
    },
    NEP413: {
      message: baseMessage,
      nonce: nonce,
      recipient: "intents.near",
    },
    SOLANA: {
      message: solanaMessage,
    },
  }
}
