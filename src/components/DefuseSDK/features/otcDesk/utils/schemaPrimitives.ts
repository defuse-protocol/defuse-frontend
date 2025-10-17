import { prepareBroadcastRequest } from "@defuse-protocol/internal-utils"
import { utils } from "@defuse-protocol/internal-utils"
import { base58, base64, base64urlnopad, hex } from "@scure/base"
import * as v from "valibot"
import { AssertionError } from "../../../errors/assert"
import { findError } from "../../../utils/errors"
import { parseDefuseAssetId } from "../../../utils/tokenUtils"
import { normalizeSignatureS } from "../../../utils/webAuthn"

export const ToBigIntSchema = v.pipe(
  v.string(),
  v.transform((a) => BigInt(a))
)

export const NearAccountIdSchema = v.pipe(
  v.string(),
  v.check(utils.validateNearAddress)
)

export const DeadlineSchema = v.pipe(v.string(), v.isoTimestamp())

export const NonceSchema = createBytesSchema("", "base64", base64, 32)

export const TokenIdSchema = v.pipe(
  v.string(),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed) {
      try {
        parseDefuseAssetId(dataset.value)
      } catch (err: unknown) {
        const e = findError(err, AssertionError)
        addIssue({ message: e ? e.message : "unknown error" })
      }
    }
  })
)

export const PublicKeyED25519Schema = createBytesSchema(
  "ed25519:",
  "base58",
  base58,
  32
)

export const SignatureED25519Schema = createBytesSchema(
  "ed25519:",
  "base58",
  base58,
  64
)

export const SignatureSecp256k1Schema = v.pipe(
  createBytesSchema("secp256k1:", "base58", base58, 65),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed) {
      const signatureHex = hex.encode(dataset.value)
      try {
        const normalizedSignature =
          prepareBroadcastRequest.normalizeERC191Signature(signatureHex)
        if (signatureHex !== normalizedSignature) {
          addIssue({
            message:
              "Signature is not normalized (recovery bit is expected to be 1 or 0)",
            expected: normalizedSignature,
          })
        }
      } catch {
        addIssue({ message: "Invalid signature format" })
      }
    }
  })
)

export const SignatureP256Schema = v.pipe(
  createBytesSchema("p256:", "base58", base58, 64),
  v.rawCheck(({ dataset, addIssue }) => {
    if (dataset.typed) {
      const sBytes = dataset.value.slice(32, 64)
      const sBytesNormalized = normalizeSignatureS(sBytes)
      if (hex.encode(sBytes) !== hex.encode(sBytesNormalized)) {
        addIssue({
          message: "Signature malleability issue (S byte must be low)",
          expected: hex.encode(sBytesNormalized),
        })
      }
    }
  })
)

export const PublicKeyP256Schema = createBytesSchema(
  "p256:",
  "base58",
  base58,
  64
)

export const WebAuthnAuthenticatorData = v.pipe(
  v.string(),
  v.rawTransform(({ dataset, addIssue, NEVER }) => {
    if (dataset.typed) {
      try {
        return base64urlnopad.decode(dataset.value)
      } catch {
        addIssue({ message: "Invalid base64 urlsafe nopad encoding" })
      }
    }
    return NEVER
  })
)

export const WebAuthnClientDataJson = v.pipe(
  v.string(),
  v.rawTransform(({ dataset, addIssue, NEVER }) => {
    if (dataset.typed) {
      try {
        return new TextEncoder().encode(dataset.value)
      } catch {
        addIssue({ message: "Invalid JSON encoding" })
      }
    }
    return NEVER
  })
)

export function createBytesSchema(
  prefix: string,
  encodingName: string,
  bytesCoder: { decode: (val: string) => Uint8Array },
  length: number
) {
  return v.pipe(
    v.string(),
    v.startsWith(prefix),
    v.rawTransform(({ dataset, addIssue, NEVER }) => {
      if (dataset.typed) {
        const key = dataset.value.slice(prefix.length)
        try {
          const bytes = bytesCoder.decode(key)
          if (bytes.length === length) {
            return bytes
          }
          addIssue({
            message: `Invalid length (${length} bytes expected, got ${bytes.length})`,
          })
        } catch {
          addIssue({ message: `Invalid ${encodingName} encoding` })
        }
      }
      return NEVER
    })
  )
}
