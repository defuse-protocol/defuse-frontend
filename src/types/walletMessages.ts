/**
 * This is just a copy-paste types from defuse-sdk,
 * as it's convenient types for signing wallet agnostic messages
 */

type ERC191Message = {
  message: string
}

type ERC191SignatureData = {
  type: "ERC191"
  signatureData: string
  signedData: ERC191Message
}

type NEP413Message = {
  message: string
  recipient: string
  nonce: Uint8Array
  callbackUrl?: string
}

type NEP413SignatureData = {
  type: "NEP413"
  signatureData: {
    accountId: string
    /**
     * Base58-encoded signature with curve prefix. Example:
     * ed25519:Gxa24TGbJu4mqdhW3GbvLXmf4bSEyxVicrtpChDWbgga
     */
    publicKey: string
    /** Base64-encoded signature */
    signature: string
  }
  /**
   * The exact data that was signed. Wallet connectors may modify this during the signing process,
   * so this property contains the actual data signed by the wallet.
   */
  signedData: NEP413Message
}

type SolanaMessage = {
  message: Uint8Array
}

type SolanaSignatureData = {
  type: "SOLANA"
  signatureData: Uint8Array
  signedData: SolanaMessage
}

export type WalletMessage = {
  ERC191: ERC191Message
  NEP413: NEP413Message
  SOLANA: SolanaMessage
}

export type WalletSignatureResult =
  | ERC191SignatureData
  | NEP413SignatureData
  | SolanaSignatureData
