import { base58, base64urlnopad } from "@scure/base"
import type { AuthMethod } from "../../types/authHandle"
import type { MultiPayload } from "../../types/defuse-contracts-types"
import type { WebAuthnSignatureData } from "../../types/walletMessage"
import type { CurveType, FormattedPublicKey } from "../../types/webAuthn"
import { assert } from "../assert"
import { extractRawSignature, parsePublicKey } from "../webAuthn"

export function makeWebAuthnMultiPayload(
  userInfo: { userAddress: string; userChainType: AuthMethod },
  signature: WebAuthnSignatureData
): MultiPayload {
  assert(
    userInfo.userChainType === "webauthn",
    "User chain and signature chain must match"
  )

  const { curveType, publicKey } = parsePublicKey(userInfo.userAddress)

  return {
    standard: "webauthn",
    payload: signature.signedData.payload,
    public_key: formatPublicKey(publicKey, curveType),
    signature: formatSignature(
      extractRawSignature(signature.signatureData.signature, curveType),
      curveType
    ),
    client_data_json: new TextDecoder("utf-8").decode(
      signature.signatureData.clientDataJSON
    ),
    authenticator_data: base64urlnopad.encode(
      new Uint8Array(signature.signatureData.authenticatorData)
    ),
  }
}

function formatPublicKey(
  publicKey: Uint8Array,
  curveType: CurveType
): FormattedPublicKey {
  return `${curveType}:${base58.encode(publicKey)}`
}

function formatSignature(signature: ArrayBuffer, curveType: CurveType) {
  return `${curveType}:${base58.encode(new Uint8Array(signature))}`
}
