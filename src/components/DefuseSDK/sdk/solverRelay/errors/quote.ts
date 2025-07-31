import type { solverRelay } from "@defuse-protocol/internal-utils"
import { BaseError } from "../../../errors/base"
import { serialize } from "../../../utils/serialize"

export class QuoteError extends BaseError {
  quote: solverRelay.FailedQuote | null
  quoteParams: Parameters<typeof solverRelay.quote>[0]

  constructor({
    quote,
    quoteParams,
  }: {
    quote: solverRelay.FailedQuote | null
    quoteParams: Parameters<typeof solverRelay.quote>[0]
  }) {
    super("Quote error", {
      details: quote == null ? "NO_QUOTE" : quote.type,
      metaMessages: [
        `Quote: ${serialize(quote)}`,
        `Quote params: ${serialize(quoteParams)}`,
      ],
      name: "QuoteError",
    })

    this.quote = quote
    this.quoteParams = quoteParams
  }
}
