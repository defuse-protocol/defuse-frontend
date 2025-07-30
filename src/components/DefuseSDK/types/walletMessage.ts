import type { DefusePayloadFor_DefuseIntents } from "./defuse-contracts-types"

// Message for EVM wallets
export type ERC191Message = {
  message: string
}

export type ERC191SignatureData = {
  type: "ERC191"
  signatureData: string
  signedData: ERC191Message
}

// Message for NEAR wallets
export type NEP413Message = {
  message: string
  recipient: string
  nonce: Uint8Array
  callbackUrl?: string
}

export type NEP413SignatureData = {
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
   * so this property contains the actual data that was signed by the wallet.
   */
  signedData: NEP413Message
}

// Message for Solana wallets
export type SolanaMessage = {
  message: Uint8Array
}

export type SolanaSignatureData = {
  type: "SOLANA"
  signatureData: Uint8Array
  signedData: SolanaMessage
}

// WebAuthn
export type WebAuthnMessage = {
  /** Hash that needs to be signed */
  challenge: Uint8Array
  /** Underlying payload that will be executed onchain */
  payload: string
  /** Parsed payload in case UI needs to display it */
  parsedPayload: DefusePayloadFor_DefuseIntents
}

/** Full response of WebAuthn Login */
export type WebAuthnSignature = AuthenticatorAssertionResponse

export type WebAuthnSignatureData = {
  type: "WEBAUTHN"
  signatureData: WebAuthnSignature
  signedData: WebAuthnMessage
}

// Message for TON wallets
export type TonConnectMessage = {
  message: { type: "text"; text: string }
}

export type TonConnectSignatureData = {
  type: "TON_CONNECT"
  signatureData: {
    signature: string
    address: string
    timestamp: number
    domain: string
    payload:
      | {
          type: "text"
          text: string
        }
      | {
          type: "cell"
          schema: string
          cell: string
        }
      | {
          type: "binary"
          bytes: string
        }
  }
  signedData: TonConnectMessage
}

export type WalletMessage = {
  ERC191: ERC191Message
  NEP413: NEP413Message
  SOLANA: SolanaMessage
  WEBAUTHN: WebAuthnMessage
  TON_CONNECT: TonConnectMessage
}

export type WalletSignatureResult =
  | ERC191SignatureData
  | NEP413SignatureData
  | SolanaSignatureData
  | WebAuthnSignatureData
  | TonConnectSignatureData
