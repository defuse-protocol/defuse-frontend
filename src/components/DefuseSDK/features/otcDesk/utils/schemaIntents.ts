import * as v from "valibot"
import {
  NearAccountIdSchema,
  ToBigIntSchema,
  TokenIdSchema,
} from "./schemaPrimitives"

const IntentTokenDiffSchema = v.object({
  intent: v.literal("token_diff"),
  diff: v.pipe(v.record(TokenIdSchema, ToBigIntSchema)),
  memo: v.optional(v.string()),
  referral: v.optional(NearAccountIdSchema),
})

export type IntentTokenDiffSchemaOutput = v.InferOutput<
  typeof IntentTokenDiffSchema
>

// It doesn't implement all possible intents
export const IntentSchema = v.variant("intent", [
  IntentTokenDiffSchema,
  v.object({
    intent: v.literal("native_withdraw"),
    receiver_id: NearAccountIdSchema,
    amount: ToBigIntSchema,
  }),
  v.object({
    intent: v.literal("ft_withdraw"),
    token: v.pipe(
      v.string(),
      v.custom(
        (a) => (typeof a === "string" ? !a.startsWith("nep141:") : false),
        "Token ID must not start with 'nep141:'"
      ),
      NearAccountIdSchema
    ),
    receiver_id: NearAccountIdSchema,
    amount: ToBigIntSchema,
    storage_deposit: v.optional(ToBigIntSchema),
    memo: v.optional(v.string()),
    msg: v.optional(v.string()),
  }),
  v.object({
    intent: v.literal("transfer"),
    tokens: v.record(
      v.string(),
      v.pipe(
        v.string(),
        v.custom(
          (a) => (typeof a === "string" ? !a.startsWith("nep141:") : false),
          "Token ID must not start with 'nep141:'"
        )
      )
    ),
    receiver_id: NearAccountIdSchema,
    memo: v.optional(v.string()),
  }),
])
