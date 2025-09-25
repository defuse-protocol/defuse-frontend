import type { QuoteError, solverRelay } from "@defuse-protocol/internal-utils"

export type AggregatedQuote = {
  quoteHashes: string[]
  /** Earliest expiration time in ISO-8601 format */
  expirationTime: string
  tokenDeltas: [string, bigint][]
  quoteParams: solverRelay.GetQuoteParams["quoteParams"][]
  isSimulation: boolean
} & (
  | { fillStatus: "FULL" }
  | { fillStatus: "PARTIAL"; quoteErrors: QuoteError[] }
)
