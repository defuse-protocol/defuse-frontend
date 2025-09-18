import { type ActorRef, type Snapshot, fromCallback } from "xstate"
import { BaseError } from "../../errors/base"
import { TimeoutError } from "../../errors/request"
import { logger } from "../../logger"
import {
  type AggregatedQuoteParams,
  type QuoteResult,
  queryQuote,
} from "../../services/quoteService"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../types/base"
import { getUnderlyingBaseTokenInfos } from "../../utils/tokenUtils"

export type QuoteInput =
  | {
      tokenIn: BaseTokenInfo | UnifiedTokenInfo
      tokenOut: BaseTokenInfo
      amountIn: { amount: bigint; decimals: number }
      balances: Record<BaseTokenInfo["defuseAssetId"], bigint>
      appFeeBps: number
    }
  | {
      tokensIn: Array<BaseTokenInfo>
      tokenOut: BaseTokenInfo
      amountIn: { amount: bigint; decimals: number }
      balances: Record<BaseTokenInfo["defuseAssetId"], bigint>
      appFeeBps: number
    }

export type Events =
  | {
      type: "NEW_QUOTE_INPUT"
      params: QuoteInput
    }
  | {
      type: "PAUSE"
    }

type EmittedEvents = {
  type: "NEW_QUOTE"
  params: {
    quoteInput: QuoteInput
    quote: QuoteResult
  }
}

export type ParentEvents = {
  type: "NEW_QUOTE"
  params: {
    quoteInput: QuoteInput
    quote: QuoteResult
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

type Input = {
  parentRef: ParentActor
}

export const backgroundQuoterMachine = fromCallback<
  Events,
  Input,
  EmittedEvents
>(({ receive, input, emit }) => {
  let abortController = new AbortController()

  receive((event) => {
    abortController.abort()
    abortController = new AbortController()

    const eventType = event.type
    switch (eventType) {
      case "PAUSE":
        return
      case "NEW_QUOTE_INPUT": {
        const quoteInput = event.params

        pollQuote(abortController.signal, quoteInput, (quote) => {
          input.parentRef.send({
            type: "NEW_QUOTE",
            params: { quoteInput, quote },
          })
          emit({
            type: "NEW_QUOTE",
            params: { quoteInput, quote },
          })
        })
        break
      }
      default:
        eventType satisfies never
        logger.warn("Unhandled event type", { eventType })
    }
  })

  return () => {
    abortController.abort()
  }
})

const INITIAL_QUOTE_WAIT_MS = [
  500, // immediate price discovery
  2000, // normal solvers
  4000, // slow solvers
  10000, // slow-MPC solvers
]
const SLOW_QUOTE_WAIT_MS = 10000 // MPC solvers

const QUOTE_POLLING_INTERVAL_MS = 5000

function pollQuote(
  signal: AbortSignal,
  quoteInput: QuoteInput,
  onResult: (result: QuoteResult) => void
): void {
  let lastSetRequestId = 0

  getQuotes({
    signal,
    quoteParams: {
      tokensIn: getUnderlyingBaseTokenInfos(
        "tokensIn" in quoteInput ? quoteInput.tokensIn : quoteInput.tokenIn
      ),
      tokenOut: quoteInput.tokenOut,
      amountIn: quoteInput.amountIn,
      balances: quoteInput.balances,
      appFeeBps: quoteInput.appFeeBps,
    },
    onResult: ({ requestId, result }) => {
      // Often fast initial quotes fail with "no quote".
      // But it doesn't mean that there's no quote at all.
      // It means Solvers couldn't provide a quote in a short time.
      // So we ignore this error and wait for the next quote.
      if (
        // strictly less is used deliberately, because we ignore only all quotes except MPC quotes
        requestId < INITIAL_QUOTE_WAIT_MS.length &&
        result.tag === "err" &&
        result.value.reason === "ERR_NO_QUOTES"
      ) {
        return
      }

      // We're interested in the latest result only
      if (lastSetRequestId < requestId) {
        lastSetRequestId = requestId
        onResult(result)
      }
    },
    onError: (error, waitMs) => {
      // Ignore the error if the quote was cancelled
      if (
        error instanceof BaseError &&
        !error.walk((err) => err instanceof TimeoutError)
      ) {
        logger.error(error)
      }
      // If the quote failed after waiting for a long time (MPC solvers),
      // treat it as "no quotes" to trigger the fallback behavior
      if (
        waitMs != null &&
        waitMs >= INITIAL_QUOTE_WAIT_MS[INITIAL_QUOTE_WAIT_MS.length - 1]
      ) {
        onResult({
          tag: "err",
          value: { reason: "ERR_NO_QUOTES" },
        })
      }
    },
  })
}

function getQuotes({
  signal,
  quoteParams,
  onResult,
  onError,
}: {
  signal: AbortSignal
  quoteParams: Omit<AggregatedQuoteParams, "waitMs">
  onResult: (arg: { result: QuoteResult; requestId: number }) => void
  onError: (error: unknown, waitMs?: number) => void
}) {
  const queryQuote = queryQuoteWithRequestId()

  for (const waitMs of INITIAL_QUOTE_WAIT_MS) {
    queryQuote({ ...quoteParams, waitMs }, { signal }).then(onResult, (error) =>
      onError(error, waitMs)
    )
  }

  const timer = setInterval(() => {
    queryQuote({ ...quoteParams, waitMs: SLOW_QUOTE_WAIT_MS }, { signal }).then(
      onResult,
      (error) => onError(error, SLOW_QUOTE_WAIT_MS)
    )
  }, QUOTE_POLLING_INTERVAL_MS)

  signal.addEventListener("abort", () => {
    clearInterval(timer)
  })
}

function queryQuoteWithRequestId() {
  let requestId = 0
  return async (...args: Parameters<typeof queryQuote>) => {
    const currentRequestId = ++requestId
    const result = await queryQuote(...args)
    return { requestId: currentRequestId, result }
  }
}
