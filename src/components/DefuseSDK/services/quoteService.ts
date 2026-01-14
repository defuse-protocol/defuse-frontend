import type { solverRelay } from "@defuse-protocol/internal-utils"
import { AggregatedQuoteError } from "../sdk/aggregatedQuote/errors/aggregatedQuoteError"
import { AmountMismatchError } from "../sdk/aggregatedQuote/errors/amountMismatchError"
import { getAggregatedQuoteExactIn } from "../sdk/aggregatedQuote/getAggregatedQuoteExactIn"
import type { BaseTokenInfo, TokenValue } from "../types/base"

export function isFailedQuote(
  quote: solverRelay.Quote | solverRelay.FailedQuote
): quote is solverRelay.FailedQuote {
  return "type" in quote
}

type TokenSlice = BaseTokenInfo

interface BaseQuoteParams {
  waitMs: number
}

export interface AggregatedQuoteParams extends BaseQuoteParams {
  tokensIn: TokenSlice[] // set of close tokens, e.g. [USDC on Solana, USDC on Ethereum, USDC on Near]
  tokenOut: TokenSlice // set of close tokens, e.g. [USDC on Solana, USDC on Ethereum, USDC on Near]
  amountIn: TokenValue // total amount in
  balances: Record<string, bigint> // how many tokens of each type are available
  appFeeBps: number
}

export interface AggregatedQuote {
  quoteHashes: string[]
  /** Earliest expiration time in ISO-8601 format */
  expirationTime: string
  tokenDeltas: [string, bigint][]
  appFee: [string, bigint][]
  /** Time estimate in seconds (only available for 1cs quotes) */
  timeEstimate?: number
}

export type QuoteResult =
  | {
      tag: "ok"
      value: AggregatedQuote
    }
  | {
      tag: "err"
      value:
        | {
            reason:
              | "ERR_INSUFFICIENT_AMOUNT"
              | "ERR_NO_QUOTES"
              | "ERR_NO_QUOTES_1CS"
          }
        | {
            reason: "ERR_UNFULFILLABLE_AMOUNT"
            shortfall: TokenValue
            overage: TokenValue | null
          }
    }
export async function queryQuote(
  input: AggregatedQuoteParams,
  {
    signal,
  }: {
    signal?: AbortSignal
  } = {}
): Promise<QuoteResult> {
  try {
    const aggregateQuote = await getAggregatedQuoteExactIn({
      aggregatedQuoteParams: {
        tokensIn: input.tokensIn,
        tokenOut: input.tokenOut,
        amountIn: input.amountIn,
        balances: input.balances,
        waitMs: input.waitMs,
        appFeeBps: input.appFeeBps,
      },
      config: {
        fetchOptions: { signal },
      },
    })

    return {
      tag: "ok",
      value: {
        quoteHashes: aggregateQuote.quoteHashes,
        expirationTime: aggregateQuote.expirationTime,
        tokenDeltas: aggregateQuote.tokenDeltas,
        appFee: aggregateQuote.appFee,
      },
    }
  } catch (err: unknown) {
    if (err instanceof AggregatedQuoteError) {
      const quoteError = err.errors.find((e) => e.quote != null)
      if (quoteError?.quote) {
        return {
          tag: "err",
          value: {
            reason: `ERR_${quoteError.quote.type}`,
          },
        }
      }
      return {
        tag: "err",
        value: {
          reason: "ERR_NO_QUOTES",
        },
      }
    }

    if (err instanceof AmountMismatchError) {
      return {
        tag: "err",
        value: {
          reason: "ERR_UNFULFILLABLE_AMOUNT",
          shortfall: err.shortfall,
          overage: err.overage,
        },
      }
    }

    throw err
  }
}
