import { QuoteError, type solverRelay } from "@defuse-protocol/internal-utils"
import { assert } from "../../utils/assert"
import type { AggregatedQuote } from "../solverRelay/types/quote"
import { AggregatedQuoteError } from "./errors/aggregatedQuoteError"

export function aggregateQuotes(
  quotes: PromiseSettledResult<solverRelay.GetQuoteReturnType>[],
  quoteParams: solverRelay.GetQuoteParams["quoteParams"][]
): AggregatedQuote {
  const quoteHashes: string[] = []
  let expirationTime = Number.POSITIVE_INFINITY
  const tokenDeltas: [string, bigint][] = []
  const validQuoteParams: solverRelay.GetQuoteParams["quoteParams"][] = []
  const quoteErrors: QuoteError[] = []

  for (const [i, quoteResult] of quotes.entries()) {
    if (quoteResult.status === "rejected") {
      if (quoteResult.reason instanceof QuoteError) {
        quoteErrors.push(quoteResult.reason)
      } else {
        throw quoteResult.reason
      }
      continue
    }

    const quote = quoteResult.value
    const amountOut = BigInt(quote.amount_out)
    const amountIn = BigInt(quote.amount_in)

    expirationTime = Math.min(
      expirationTime,
      new Date(quote.expiration_time).getTime()
    )

    tokenDeltas.push([quote.defuse_asset_identifier_in, -amountIn])
    tokenDeltas.push([quote.defuse_asset_identifier_out, amountOut])

    quoteHashes.push(quote.quote_hash)

    const currQuoteParams = quoteParams[i]
    assert(currQuoteParams != null)
    validQuoteParams.push(currQuoteParams)
  }

  if (quoteHashes.length === 0) {
    throw new AggregatedQuoteError({ errors: quoteErrors })
  }

  let aggregatedQuote: AggregatedQuote = {
    quoteHashes,
    expirationTime: new Date(
      expirationTime === Number.POSITIVE_INFINITY ? 0 : expirationTime
    ).toISOString(),
    tokenDeltas,
    quoteParams: validQuoteParams,
    isSimulation: false,
    fillStatus: "FULL",
  }

  if (quoteErrors.length > 0) {
    aggregatedQuote = {
      ...aggregatedQuote,
      fillStatus: "PARTIAL",
      quoteErrors: quoteErrors,
    }
  }

  return aggregatedQuote
}
