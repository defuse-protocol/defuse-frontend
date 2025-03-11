import { parseAuthenticatorData } from "@simplewebauthn/server/helpers"
import cbor from "cbor"

export function parsePublicKeyFromCBOR(cred: PublicKeyCredential): {
  publicKey: Uint8Array
  algorithm: number
} {
  const decodedAttestationObj = cbor.decode(
    (cred.response as AuthenticatorAttestationResponse).attestationObject
  )
  const authData = parseAuthenticatorData(decodedAttestationObj.authData)
  const publicKey = cbor.decode(
    authData?.credentialPublicKey?.buffer as ArrayBuffer
  )

  const algorithm = publicKey.get(3)

  switch (algorithm) {
    // ES256
    case -7: {
      const x = publicKey.get(-2)
      const y = publicKey.get(-3)

      const credentialPublicKey = new Uint8Array([...x, ...y])
      const len = credentialPublicKey.length

      if (len !== 64) {
        throw new Error(`Invalid P-256 public key length: ${len}`)
      }

      return {
        publicKey: credentialPublicKey,
        algorithm,
      }
    }

    // EdDSA (Ed25519)
    case -8: {
      const credentialPublicKey = publicKey.get(-2)
      const len = credentialPublicKey.length

      if (len !== 32) {
        throw new Error(`Invalid Ed25519 public key length: ${len}`)
      }

      return {
        publicKey: credentialPublicKey,
        algorithm,
      }
    }

    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`)
  }
}
