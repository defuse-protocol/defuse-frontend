import { secp256k1 } from "@noble/curves/secp256k1"
import { base58 } from "@scure/base"
import { sign } from "tweetnacl"
import { verifyMessage as verifyMessageViem } from "viem"
import type { WalletSignatureResult } from "../types/walletMessage"
import { parsePublicKey, verifyAuthenticatorAssertion } from "./webAuthn"

// No-op usage to prevent tree-shaking. sec256k1 is dynamically loaded by viem.
const _noop = secp256k1.getPublicKey || null

export async function verifyWalletSignature(
  signature: WalletSignatureResult,
  userAddress: string
) {
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
    case "WEBAUTHN":
      return verifyAuthenticatorAssertion(
        signature.signatureData,
        parsePublicKey(userAddress),
        signature.signedData.challenge
      )
    case "TON_CONNECT":
      // todo: implement https://github.com/tonkeeper/demo-dapp-with-wallet/blob/master/src/components/SignDataForm/verify.ts
      return true

    default:
      signatureType satisfies never
      throw new Error("exhaustive check failed")
  }
}
