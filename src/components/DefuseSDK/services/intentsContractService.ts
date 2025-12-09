import { utils } from "@defuse-protocol/internal-utils"
import { hex } from "@scure/base"
import type { providers } from "near-api-js"
import * as v from "valibot"
import { config } from "../config"

export async function getProtocolFee(
  params: { nearClient: providers.Provider } & utils.OptionalBlockReference
) {
  const data = await utils.queryContract({
    ...params,
    contractId: config.env.contractID,
    methodName: "fee",
    args: {},
    schema: v.number(),
  })

  // in bip: 1 bip = 0.0001% = 0.000001
  return data
}

export async function hasPublicKey({
  accountId,
  publicKey,
  ...params
}: {
  nearClient: providers.Provider
  accountId: string
  publicKey: string
} & utils.OptionalBlockReference): Promise<boolean> {
  const data = await utils.queryContract({
    ...params,
    contractId: config.env.contractID,
    methodName: "has_public_key",
    args: {
      account_id: accountId,
      public_key: publicKey,
    },
    schema: v.boolean(),
  })

  return data
}

export async function isNonceUsed({
  accountId,
  nonce,
  ...params
}: {
  nearClient: providers.Provider
  accountId: string
  nonce: string
} & utils.OptionalBlockReference): Promise<boolean> {
  const data = await utils.queryContract({
    ...params,
    contractId: config.env.contractID,
    methodName: "is_nonce_used",
    args: {
      account_id: accountId,
      nonce: nonce,
    },
    schema: v.boolean(),
  })

  return data
}

export async function batchBalanceOf({
  accountId,
  tokenIds,
  ...params
}: {
  nearClient: providers.Provider
  accountId: string
  tokenIds: string[]
} & utils.OptionalBlockReference): Promise<bigint[]> {
  const data = await utils.queryContract({
    ...params,
    contractId: config.env.contractID,
    methodName: "mt_batch_balance_of",
    args: {
      account_id: accountId,
      token_ids: tokenIds,
    },
    schema: v.pipe(
      v.array(v.string()),
      v.transform((v) => v.map(BigInt))
    ),
  })

  return data
}

export async function salt(
  params: { nearClient: providers.Provider } & utils.OptionalBlockReference
): Promise<Uint8Array> {
  const value = await utils.queryContract({
    contractId: config.env.contractID,
    methodName: "current_salt",
    args: {},
    finality: "optimistic",
    nearClient: params.nearClient,
    schema: v.string(),
  })

  return hex.decode(value)
}
