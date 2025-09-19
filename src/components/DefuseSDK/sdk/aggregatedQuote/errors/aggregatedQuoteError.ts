import type { QuoteError } from "@defuse-protocol/internal-utils"
import { BaseError } from "../../../errors/base"

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
