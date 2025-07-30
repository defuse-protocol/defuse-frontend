import * as v from "valibot"
import { RpcRequestError } from "../errors/request"

type SuccessResult<result> = {
  result: result
  error?: undefined
}
type ErrorResult<error> = {
  result?: undefined
  error: error
}
export type RpcResponse<TResult = unknown, TError = unknown> = {
  jsonrpc: `${number}`
  id: number | string
} & (SuccessResult<TResult> | ErrorResult<TError>)

export async function handleRPCResponse<
  TSchema extends v.BaseSchema<TInput, TOutput, TIssue>,
  TInput,
  TOutput extends RpcResponse<
    unknown,
    { code: number; data: unknown; message: string }
  >,
  TIssue extends v.BaseIssue<unknown>,
>(response: Response, body: unknown, schema: TSchema) {
  const json = await response.json()

  const parsed = v.safeParse(schema, json)
  if (parsed.success) {
    if (parsed.output.error !== undefined) {
      throw new RpcRequestError({
        body,
        error: parsed.output.error,
        url: response.url,
      })
    }

    return parsed.output.result
  }

  throw new RpcRequestError({
    body,
    error: { code: -1, data: json, message: "Invalid response" },
    url: response.url,
  })
}
