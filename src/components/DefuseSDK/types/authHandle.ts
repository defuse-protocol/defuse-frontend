export type AuthMethod =
  | "near"
  | "evm"
  | "solana"
  | "webauthn"
  | "ton"
  | "stellar"

export const AuthMethod = {
  Near: "near",
  EVM: "evm",
  Solana: "solana",
  WebAuthn: "webauthn",
  Ton: "ton",
  Stellar: "stellar",
} as const

/**
 * Represents a public identifier used for authentication.
 * This could be a blockchain address, account name, or public key.
 * This is always a public value - never contains private keys or passwords.
 */
export type AuthIdentifier = string

export type AuthHandle = {
  identifier: AuthIdentifier
  method: AuthMethod
}
