import type { solverRelay } from "@defuse-protocol/internal-utils"
import { Err, Ok, type Result } from "@thames/monads"
import { settings } from "../../../constants/settings"
import { quoteWithLog } from "../../../sdk/solverRelay/utils/quoteWithLog"
import {
  type AggregatedQuote,
  isFailedQuote,
} from "../../../services/quoteService"

export type AggregatedQuoteErr =
  | { reason: "NO_QUOTES" }
  | { reason: "INSUFFICIENT_AMOUNT"; minAmount: bigint }

export type QuoteExactInParams = {
  tokenIn: string
  tokenOut: string
  amountIn: bigint
}

export async function manyQuotes(
  swapParams: QuoteExactInParams[],
  config: { logBalanceSufficient: boolean }
): Promise<Result<AggregatedQuote[], AggregatedQuoteErr>> {
  const quoteResults = await Promise.all(
    swapParams.map(async ({ tokenIn, tokenOut, amountIn }) => {
      return quoteWithLog(
        {
          defuse_asset_identifier_in: tokenIn,
          defuse_asset_identifier_out: tokenOut,
          exact_amount_in: amountIn.toString(),
          min_deadline_ms: settings.quoteMinDeadlineMs,
        },
        config
      ).then(handleQuote)
    })
  )

  const quoteErr = quoteResults.find((q) => q.isErr())
  if (quoteErr) {
    return Err(quoteErr.unwrapErr())
  }

  const quotes = quoteResults.map((q) => q.unwrap())

  return Ok(quotes)
}

function handleQuote(
  quotes: Awaited<ReturnType<typeof quoteWithLog>>
): Result<AggregatedQuote, AggregatedQuoteErr> {
  if (quotes == null) {
    return Err({ reason: "NO_QUOTES" })
  }

  const failedQuotes: solverRelay.FailedQuote[] = []
  const validQuotes: solverRelay.Quote[] = []
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
    return Ok({
      quoteHashes: [bestQuote.quote_hash],
      expirationTime: bestQuote.expiration_time,
      tokenDeltas: [
        [bestQuote.defuse_asset_identifier_in, -BigInt(bestQuote.amount_in)],
        [bestQuote.defuse_asset_identifier_out, BigInt(bestQuote.amount_out)],
      ],
      appFee: [],
    })
  }

  const failedQuote = failedQuotes[0]
  if (failedQuote) {
    return Err({
      reason: failedQuote.type,
      minAmount:
        failedQuote.min_amount != null ? BigInt(failedQuote.min_amount) : 0n,
    })
  }

  return Err({ reason: "NO_QUOTES" })
}

export function areQuotesExpired(quotes: AggregatedQuote[]): boolean {
  const MIN_BUFFER_TIME_MS = 10_000 // 10 seconds
  return !quotes.every((quote) => {
    const quoteDeadline = new Date(quote.expirationTime).getTime()
    const maxDeadline = Date.now() + MIN_BUFFER_TIME_MS
    return quoteDeadline < maxDeadline
  })
}

export async function getFreshQuoteHashes(
  quotes: AggregatedQuote[],
  quoteParams: QuoteExactInParams[],
  config: { logBalanceSufficient: boolean }
): Promise<Result<string[], AggregatedQuoteErr>> {
  if (areQuotesExpired(quotes)) {
    const newQuotes = await manyQuotes(quoteParams, config)
    if (newQuotes.isErr()) {
      return Err(newQuotes.unwrapErr())
    }
    // biome-ignore lint/style/noParameterAssign: It's safe to reassign here
    quotes = newQuotes.unwrap()
  }
  const quoteHashes = quotes.flatMap((q) => q.quoteHashes)
  return Ok(quoteHashes)
}
