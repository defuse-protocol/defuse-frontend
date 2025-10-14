import type { providers } from "near-api-js"
import type {
  BlockId,
  BlockReference,
  Finality,
} from "near-api-js/lib/providers/provider"
import * as v from "valibot"

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

// Copied from https://github.com/near/near-account-id-rs/blob/8174b47afdc608feefc0949d23c9c14bb810b544/src/validation.rs#L58C42-L58C97
const ACCOUNT_ID_REGEX = /^(([a-z\d]+[-_])*[a-z\d]+\.)*([a-z\d]+[-_])*[a-z\d]+$/
const MIN_ACCOUNT_ID_LENGTH = 2
const ETH_IMPLICIT_ACCOUNT_LENGTH = 42
const NEAR_IMPLICIT_ACCOUNT_LENGTH = 64

export function validateNearAddress(accountId: string): boolean {
  if (
    accountId.length < MIN_ACCOUNT_ID_LENGTH ||
    accountId.length > NEAR_IMPLICIT_ACCOUNT_LENGTH
  ) {
    return false
  }
  if (isImplicitAccount(accountId)) {
    return true
  }
  return ACCOUNT_ID_REGEX.test(accountId)
}

function isEthImplicitAccount(accountId: string): boolean {
  return (
    accountId.length === ETH_IMPLICIT_ACCOUNT_LENGTH &&
    accountId.startsWith("0x") &&
    /^[0-9a-f]+$/i.test(accountId.slice(2))
  )
}

function isNearDeterministic(accountId: string): boolean {
  return (
    accountId.length === ETH_IMPLICIT_ACCOUNT_LENGTH &&
    accountId.startsWith("0s") &&
    /^[0-9a-f]+$/i.test(accountId.slice(2))
  )
}

function isNearImplicit(accountId: string): boolean {
  return (
    accountId.length === NEAR_IMPLICIT_ACCOUNT_LENGTH &&
    /^[0-9a-f]+$/i.test(accountId)
  )
}

export function isImplicitAccount(accountId: string): boolean {
  return (
    (isEthImplicitAccount(accountId) ||
      isNearImplicit(accountId) ||
      isNearDeterministic(accountId)) &&
    !accountId.includes(".")
  )
}
