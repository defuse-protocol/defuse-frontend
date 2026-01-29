import * as v from "valibot"

const FungibleTokenInfoSchema = v.object({
  defuseAssetId: v.string(),
  address: v.string(),
  symbol: v.string(),
  name: v.string(),
  decimals: v.number(),
  icon: v.string(),
  chainName: v.string(),
})

const NativeTokenInfoSchema = v.object({
  defuseAssetId: v.string(),
  type: v.literal("native"),
  symbol: v.string(),
  name: v.string(),
  decimals: v.number(),
  icon: v.string(),
  chainName: v.string(),
})

const BaseTokenInfoSchema = v.union([
  FungibleTokenInfoSchema,
  NativeTokenInfoSchema,
])

const UnifiedTokenInfoSchema = v.object({
  unifiedAssetId: v.string(),
  symbol: v.string(),
  name: v.string(),
  icon: v.string(),
  decimals: v.optional(v.number()),
  tags: v.optional(v.array(v.string())),
  groupedTokens: v.array(BaseTokenInfoSchema),
})

const GiftMakerHistorySchemaV0 = v.object({
  giftId: v.string(),
  intentHashes: v.array(v.string()),
  tokenDiff: v.record(v.string(), v.string()),
  token: v.union([BaseTokenInfoSchema, UnifiedTokenInfoSchema]),
  secretKey: v.string(),
  accountId: v.string(),
  message: v.string(),
  updatedAt: v.number(),
})

const GiftMakerHistorySchemaV1 = v.object({
  giftId: v.string(),
  intentHashes: v.array(v.string()),
  tokenDiff: v.record(v.string(), v.bigint()),
  token: v.union([BaseTokenInfoSchema, UnifiedTokenInfoSchema]),
  secretKey: v.string(),
  accountId: v.string(),
  message: v.string(),
  updatedAt: v.number(),
})

const GiftMakerHistorySchemaV2 = v.object({
  tokenDiff: v.record(v.string(), v.string()),
  secretKey: v.string(),
  message: v.string(),
  intentHashes: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
})

const GiftMakerHistorySchemaV3 = v.object({
  tokenDiff: v.record(v.string(), v.string()),
  secretKey: v.string(),
  message: v.string(),
  iv: v.optional(v.string()),
  intentHashes: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  expiresAt: v.optional(v.nullable(v.number())),
})

export const GiftStorageSchemaV0 = v.object({
  state: v.object({
    gifts: v.record(v.string(), v.array(GiftMakerHistorySchemaV0)),
  }),
})

export const GiftStorageSchemaV1 = v.object({
  state: v.object({
    gifts: v.record(v.string(), v.array(GiftMakerHistorySchemaV1)),
  }),
})

export const GiftStorageSchemaV2 = v.object({
  state: v.object({
    gifts: v.record(v.string(), v.array(GiftMakerHistorySchemaV2)),
  }),
})

export const GiftStorageSchemaV3 = v.object({
  state: v.object({
    gifts: v.record(v.string(), v.array(GiftMakerHistorySchemaV3)),
  }),
})
