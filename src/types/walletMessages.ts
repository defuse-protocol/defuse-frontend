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

// WebAuthn

export type WebAuthnMessage<T> = {
  /** Hash that needs to be signed */
  challenge: Uint8Array
  /** Underlying payload that will be executed onchain */
  payload: string
  /** Parsed payload in case UI needs to display it */
  parsedPayload: T
}

/** Full response of WebAuthn Login */
export type WebAuthnSignature = AuthenticatorAssertionResponse

export type WebAuthnSignatureData<T> = {
  type: "WEBAUTHN"
  signatureData: WebAuthnSignature
  signedData: WebAuthnMessage<T>
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

// Message for Stellar wallets
export type StellarMessage = {
  message: string
}

export type StellarSignatureData = {
  type: "STELLAR"
  signatureData: Uint8Array
  signedData: StellarMessage
}

export type WalletMessage<T> = {
  ERC191: ERC191Message
  NEP413: NEP413Message
  SOLANA: SolanaMessage
  WEBAUTHN: WebAuthnMessage<T>
  TON_CONNECT: TonConnectMessage
  STELLAR: StellarMessage
}

export type WalletSignatureResult<T> =
  | ERC191SignatureData
  | NEP413SignatureData
  | SolanaSignatureData
  | WebAuthnSignatureData<T>
  | TonConnectSignatureData
  | StellarSignatureData
