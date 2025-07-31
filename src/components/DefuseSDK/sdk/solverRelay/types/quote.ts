import type { QuoteError } from "../errors/quote"
import type { GetQuoteParams } from "../getQuote"

export type AggregatedQuote = {
  quoteHashes: string[]
  /** Earliest expiration time in ISO-8601 format */
  expirationTime: string
  tokenDeltas: [string, bigint][]
  quoteParams: GetQuoteParams["quoteParams"][]
  isSimulation: boolean
} & (
  | { fillStatus: "FULL" }
  | { fillStatus: "PARTIAL"; quoteErrors: QuoteError[] }
)
