import type { poaBridge, solverRelay } from "@defuse-protocol/internal-utils"
import { QuoteError } from "./errors/quote"
import { quoteWithLog } from "./utils/quoteWithLog"

export type GetQuoteParams = {
  quoteParams: Parameters<typeof quoteWithLog>[0]
  config: Parameters<typeof quoteWithLog>[1]
}

export type GetQuoteReturnType = solverRelay.Quote

export type GetQuoteErrorType =
  | QuoteError
  | poaBridge.httpClient.JSONRPCErrorType

export async function getQuote(
  params: GetQuoteParams
): Promise<GetQuoteReturnType> {
  const result = await quoteWithLog(params.quoteParams, params.config)
  return handleQuoteResult(result, params.quoteParams)
}

function handleQuoteResult(
  result: Awaited<ReturnType<typeof solverRelay.quote>>,
  quoteParams: GetQuoteParams["quoteParams"]
) {
  if (result == null) {
    throw new QuoteError({
      quote: null,
      quoteParams,
    })
  }

  const failedQuotes: solverRelay.FailedQuote[] = []
  const validQuotes = []
  for (const q of result) {
    if (isValidQuote(q)) {
      validQuotes.push(q)
    } else {
      failedQuotes.push(q)
    }
  }

  const quoteKind =
    quoteParams.exact_amount_in !== null ? "exact_in" : "exact_out"
  const bestQuote = sortQuotes(validQuotes, quoteKind)[0]
  if (bestQuote != null) {
    return bestQuote
  }

  const failedQuote = failedQuotes[0]
  if (failedQuote != null) {
    throw new QuoteError({
      quote: failedQuote,
      quoteParams,
    })
  }

  throw new QuoteError({
    quote: null,
    quoteParams,
  })
}

function sortQuotes(
  quotes: solverRelay.Quote[],
  quoteKind: "exact_in" | "exact_out"
): solverRelay.Quote[] {
  return quotes.slice().sort((a, b) => {
    if (quoteKind === "exact_in") {
      // For exact_in, sort by `amount_out` in descending order
      if (BigInt(a.amount_out) > BigInt(b.amount_out)) return -1
      if (BigInt(a.amount_out) < BigInt(b.amount_out)) return 1
      return 0
    }

    // For exact_out, sort by `amount_in` in ascending order
    if (BigInt(a.amount_in) < BigInt(b.amount_in)) return -1
    if (BigInt(a.amount_in) > BigInt(b.amount_in)) return 1
    return 0
  })
}

function isValidQuote(
  quote: solverRelay.Quote | solverRelay.FailedQuote
): quote is solverRelay.Quote {
  return !("type" in quote)
}
