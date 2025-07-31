import { BaseError } from "../../../errors/base"
import type { QuoteError } from "../../solverRelay/errors/quote"

export class AggregatedQuoteError extends BaseError {
  errors: Array<QuoteError>

  constructor({
    errors,
  }: {
    errors: Array<QuoteError>
  }) {
    super("Aggregated quote error", {
      cause: errors,
      name: "AggregatedQuoteError",
    })

    this.errors = errors
  }
}
