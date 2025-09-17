import type { solverRelay } from "@defuse-protocol/internal-utils"
import { settings } from "../constants/settings"
import { AggregatedQuoteError } from "../sdk/aggregatedQuote/errors/aggregatedQuoteError"
import { AmountMismatchError } from "../sdk/aggregatedQuote/errors/amountMismatchError"
import { getAggregatedQuoteExactIn } from "../sdk/aggregatedQuote/getAggregatedQuoteExactIn"
import { quoteWithLog } from "../sdk/solverRelay/utils/quoteWithLog"
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

// TODO: Remove if we don't need it
export async function queryQuoteExactOut(
  input: {
    tokenIn: BaseTokenInfo["defuseAssetId"]
    tokenOut: BaseTokenInfo["defuseAssetId"]
    exactAmountOut: bigint
    minDeadlineMs?: number
  },
  {
    logBalanceSufficient,
    signal,
  }: {
    logBalanceSufficient: boolean
    signal?: AbortSignal
  }
): Promise<QuoteResult> {
  const quotes = await quoteWithLog(
    {
      defuse_asset_identifier_in: input.tokenIn,
      defuse_asset_identifier_out: input.tokenOut,
      exact_amount_out: input.exactAmountOut.toString(),
      min_deadline_ms: input.minDeadlineMs ?? settings.quoteMinDeadlineMs,
    },

    {
      fetchOptions: { signal },
      logBalanceSufficient: logBalanceSufficient,
    }
  )

  if (quotes == null) {
    return {
      tag: "err",
      value: {
        reason: "ERR_NO_QUOTES",
      },
    }
  }

  const failedQuotes: solverRelay.FailedQuote[] = []
  const validQuotes = []
  for (const q of quotes) {
    if (isFailedQuote(q)) {
      failedQuotes.push(q)
    } else {
      validQuotes.push(q)
    }
  }

  validQuotes.sort((a, b) => {
    // Sort by `amount_in` in ascending order, because backend does not sort
    if (BigInt(a.amount_in) < BigInt(b.amount_in)) return -1
    if (BigInt(a.amount_in) > BigInt(b.amount_in)) return 1
    return 0
  })

  const bestQuote = validQuotes[0]

  if (bestQuote) {
    return {
      tag: "ok",
      value: {
        quoteHashes: [bestQuote.quote_hash],
        expirationTime: bestQuote.expiration_time,
        tokenDeltas: [
          [input.tokenIn, -BigInt(bestQuote.amount_in)],
          [input.tokenOut, BigInt(bestQuote.amount_out)],
        ],
        appFee: [],
      },
    }
  }

  if (failedQuotes[0]) {
    return {
      tag: "err",
      value: {
        reason: `ERR_${failedQuotes[0].type}`,
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
