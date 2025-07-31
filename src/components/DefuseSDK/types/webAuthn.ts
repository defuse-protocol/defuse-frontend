// Supported curves
export type CurveType = "p256" | "ed25519"

type Base58 = string
export type FormattedPublicKey = `${CurveType}:${Base58}`

/**
 * https://www.w3.org/TR/webauthn-2/#credential-public-key
 */
export type CredentialKey = {
  curveType: CurveType
  publicKey: Uint8Array
}
