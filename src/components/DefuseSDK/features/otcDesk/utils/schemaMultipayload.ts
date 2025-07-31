import * as v from "valibot"
import { IntentSchema } from "./schemaIntents"
import {
  DeadlineSchema,
  NearAccountIdSchema,
  NonceSchema,
  PublicKeyED25519Schema,
  PublicKeyP256Schema,
  SignatureED25519Schema,
  SignatureP256Schema,
  SignatureSecp256k1Schema,
  WebAuthnAuthenticatorData,
  WebAuthnClientDataJson,
} from "./schemaPrimitives"

export const GeneralPayloadObjectSchema = v.object({
  deadline: DeadlineSchema,
  nonce: NonceSchema,
  signer_id: NearAccountIdSchema,
  verifying_contract: NearAccountIdSchema,
  intents: v.array(IntentSchema),
})

export const GeneralPayloadStringSchema = v.pipe(
  v.string(),
  v.transform((a) => {
    try {
      return JSON.parse(a)
    } catch {
      return null
    }
  }),
  GeneralPayloadObjectSchema
)

const NEP413PayloadObjectSchema = v.object({
  deadline: DeadlineSchema,
  signer_id: NearAccountIdSchema,
  intents: v.array(IntentSchema),
})

const NEP413PayloadStringSchema = v.pipe(
  v.string(),
  v.transform((a) => {
    try {
      return JSON.parse(a)
    } catch {
      return null
    }
  }),
  NEP413PayloadObjectSchema
)

export const PayloadStringSchema = v.union([
  GeneralPayloadStringSchema,
  NEP413PayloadStringSchema,
])

export const MultiPayloadSchema = v.variant("standard", [
  v.object({
    standard: v.literal("nep413"),
    payload: v.object({
      message: v.string(),
      nonce: NonceSchema,
      recipient: NearAccountIdSchema,
      callbackUrl: v.optional(v.string()),
    }),
    signature: SignatureED25519Schema,
    public_key: PublicKeyED25519Schema,
  }),
  v.object({
    standard: v.literal("erc191"),
    payload: v.string(),
    signature: SignatureSecp256k1Schema,
  }),
  v.object({
    standard: v.literal("raw_ed25519"),
    payload: v.string(),
    signature: SignatureED25519Schema,
    public_key: PublicKeyED25519Schema,
  }),
  v.pipe(
    v.looseObject({
      standard: v.literal("webauthn"),
      public_key: v.string(),
    }),
    v.transform((a) => {
      return { ...a, curveType: a.public_key.split(":")[0] }
    }),
    v.variant("curveType", [
      v.object({
        standard: v.literal("webauthn"),
        curveType: v.literal("p256"),
        payload: v.string(),
        signature: SignatureP256Schema,
        public_key: PublicKeyP256Schema,
        authenticator_data: WebAuthnAuthenticatorData,
        client_data_json: WebAuthnClientDataJson,
      }),
      v.object({
        standard: v.literal("webauthn"),
        curveType: v.literal("ed25519"),
        payload: v.string(),
        signature: SignatureED25519Schema,
        public_key: PublicKeyED25519Schema,
        authenticator_data: WebAuthnAuthenticatorData,
        client_data_json: WebAuthnClientDataJson,
      }),
    ])
  ),
])

export type MultiPayloadSchemaOutput = v.InferOutput<typeof MultiPayloadSchema>

export const MultiPayloadDeepSchema = v.variant("standard", [
  v.object({
    standard: v.literal("nep413"),
    payload: v.object({
      message: NEP413PayloadStringSchema,
      nonce: NonceSchema,
      recipient: NearAccountIdSchema,
      callbackUrl: v.optional(v.string()),
    }),
    signature: SignatureED25519Schema,
    public_key: PublicKeyED25519Schema,
  }),
  v.object({
    standard: v.literal("erc191"),
    payload: GeneralPayloadStringSchema,
    signature: SignatureSecp256k1Schema,
  }),
  v.object({
    standard: v.literal("raw_ed25519"),
    payload: GeneralPayloadStringSchema,
    signature: SignatureED25519Schema,
    public_key: PublicKeyED25519Schema,
  }),
  v.pipe(
    v.looseObject({
      standard: v.literal("webauthn"),
      public_key: v.string(),
    }),
    v.transform((a) => {
      return { ...a, curveType: a.public_key.split(":")[0] }
    }),
    v.variant("curveType", [
      v.object({
        standard: v.literal("webauthn"),
        curveType: v.literal("p256"),
        payload: GeneralPayloadStringSchema,
        signature: SignatureP256Schema,
        public_key: PublicKeyP256Schema,
        authenticator_data: WebAuthnAuthenticatorData,
        client_data_json: WebAuthnClientDataJson,
      }),
      v.object({
        standard: v.literal("webauthn"),
        curveType: v.literal("ed25519"),
        payload: GeneralPayloadStringSchema,
        signature: SignatureED25519Schema,
        public_key: PublicKeyED25519Schema,
        authenticator_data: WebAuthnAuthenticatorData,
        client_data_json: WebAuthnClientDataJson,
      }),
    ])
  ),
])

export const MultiPayloadPlainSchema = v.pipe(
  v.union([v.string(), v.record(v.string(), v.unknown())]),
  v.transform((a) => {
    try {
      return typeof a === "string" ? JSON.parse(a) : a
    } catch {
      return null
    }
  }),
  MultiPayloadSchema
)
