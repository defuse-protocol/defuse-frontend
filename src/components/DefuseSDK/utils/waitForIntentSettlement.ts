import {
  type ILogger,
  IntentSettlementError,
  RETRY_CONFIGS,
  type RetryOptions,
  solverRelay,
} from "@defuse-protocol/internal-utils"
import { retry } from "@lifeomic/attempt"
import { BaseError } from "../errors/base"
import {
  HttpRequestError,
  RpcRequestError,
  TimeoutError,
} from "../errors/request"

export type WaitForIntentSettlementReturnType = {
  txHash: string
  intentHash: string
}

export async function waitForIntentSettlement({
  intentHash,
  signal,
  baseURL,
  retryOptions = RETRY_CONFIGS.TWO_MINS_GRADUAL,
  logger,
  onTxHashKnown,
}: {
  intentHash: string
  signal: AbortSignal
  baseURL?: string
  retryOptions?: RetryOptions
  logger?: ILogger
  onTxHashKnown?: (a: { txHash: string }) => void
}): Promise<WaitForIntentSettlementReturnType> {
  return retry(
    async () => {
      const res = await solverRelay.httpClient.getStatus(
        { intent_hash: intentHash },
        { baseURL, fetchOptions: { signal }, logger }
      )

      if (res.status === "TX_BROADCASTED" || res.status === "SETTLED") {
        onTxHashKnown?.({ txHash: res.data.hash })
      }

      if (res.status === "SETTLED") {
        return {
          txHash: res.data.hash,
          intentHash: res.intent_hash,
        }
      }

      throw new IntentSettlementError(res)
    },
    {
      ...retryOptions,
      handleError: (err, context) => {
        // We keep retrying since we haven't received the necessary status
        if (err instanceof IntentSettlementError) {
          return
        }

        // We keep retrying if it is a network error or requested timed out
        if (
          err instanceof BaseError &&
          err.walk(
            (err) =>
              err instanceof HttpRequestError ||
              err instanceof TimeoutError ||
              err instanceof RpcRequestError
          )
        ) {
          return
        }

        context.abort()
      },
    }
  )
}
