import type { walletMessage } from "@defuse-protocol/internal-utils"
import { secp256k1 } from "@noble/curves/secp256k1"
import { sha256 } from "@noble/hashes/sha256"
import { base58 } from "@scure/base"
import { Keypair } from "@stellar/stellar-sdk"
import { sign } from "tweetnacl"
import { verifyMessage as verifyMessageViem } from "viem"
import { parsePublicKey, verifyAuthenticatorAssertion } from "./webAuthn"

// No-op usage to prevent tree-shaking. sec256k1 is dynamically loaded by viem.
const _noop = secp256k1.getPublicKey || null

export async function verifyWalletSignature(
  signature: walletMessage.WalletSignatureResult,
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
    case "STELLAR_RAW": {
      // Convert Stellar address to public key bytes
      const keypair = Keypair.fromPublicKey(userAddress)
      const publicKeyBytes = keypair.rawPublicKey()

      // Convert message to Uint8Array if it's a string
      const messageBytes =
        typeof signature.signedData.message === "string"
          ? new TextEncoder().encode(signature.signedData.message)
          : signature.signedData.message

      return sign.detached.verify(
        messageBytes,
        signature.signatureData,
        publicKeyBytes
      )
    }
    case "STELLAR_SEP53": {
      // Convert Stellar address to public key bytes
      const keypair = Keypair.fromPublicKey(userAddress)
      const publicKeyBytes = keypair.rawPublicKey()

      // Step 1: Encode the message with prefix
      const prefix = "Stellar Signed Message:\n"
      const prefixBytes = new TextEncoder().encode(prefix)
      const messageBytes = new TextEncoder().encode(
        signature.signedData.message
      )
      const signedMessageBase = new Uint8Array([
        ...prefixBytes,
        ...messageBytes,
      ])

      // Step 2: Hash the encoded message (SHA256 of signedMessageBase)
      const messageHash = sha256(signedMessageBase)

      return sign.detached.verify(
        messageHash,
        signature.signatureData,
        publicKeyBytes
      )
    }
    default:
      signatureType satisfies never
      throw new Error("exhaustive check failed")
  }
}
