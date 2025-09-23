import type { providers } from "near-api-js"
import type {
  BlockId,
  BlockReference,
  Finality,
} from "near-api-js/lib/providers/provider"
import * as v from "valibot"
import { isAddress } from "viem"

/**
 * Use this function to decode a raw response from `nearClient.query()`
 */
export function decodeQueryResult<
  T extends v.BaseSchema<TInput, TOutput, TIssue>,
  TInput,
  TOutput,
  TIssue extends v.BaseIssue<unknown>,
>(response: unknown, schema: T): v.InferOutput<T> {
  const parsed = v.parse(v.object({ result: v.array(v.number()) }), response)
  const uint8Array = new Uint8Array(parsed.result)
  const decoder = new TextDecoder()
  const result = decoder.decode(uint8Array)
  return v.parse(schema, JSON.parse(result))
}

export type OptionalBlockReference = {
  blockId?: BlockId
  finality?: Finality
}

function getBlockReference({
  blockId,
  finality,
}: OptionalBlockReference): BlockReference {
  if (blockId != null) {
    return { blockId }
  }

  if (finality != null) {
    return { finality }
  }

  return { finality: "optimistic" }
}

export async function queryContract({
  nearClient,
  contractId,
  methodName,
  args,
  blockId,
  finality,
}: {
  nearClient: providers.Provider
  contractId: string
  methodName: string
  args: Record<string, unknown>
  blockId?: BlockId
  finality?: Finality
}): Promise<unknown> {
  const response = await nearClient.query({
    request_type: "call_function",
    account_id: contractId,
    method_name: methodName,
    args_base64: btoa(JSON.stringify(args)),
    ...getBlockReference({ blockId, finality }),
  })

  return decodeQueryResult(response, v.unknown())
}

// Copied from https://github.com/mynearwallet/my-near-wallet/blob/3b1a6c6e5c62a0235f5e32d370f803fa2180c6f8/packages/frontend/src/utils/wallet.ts#L75

const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/

const IMPLICIT_ACCOUNT_MAX_LENGTH = 64

export function isLegitAccountId(accountId: string): boolean {
  // EVM-like account check
  if (isAddress(accountId) && accountId === accountId.toLowerCase()) {
    return true
  }

  // Explicit and implicit account check
  return ACCOUNT_ID_REGEX.test(accountId)
}

export function isImplicitAccount(accountId: string): boolean {
  return (
    accountId.length === IMPLICIT_ACCOUNT_MAX_LENGTH && !accountId.includes(".")
  )
}
