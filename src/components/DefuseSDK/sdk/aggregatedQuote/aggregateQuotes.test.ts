import { QuoteError, type solverRelay } from "@defuse-protocol/internal-utils"
import { describe, expect, it } from "vitest"
import { aggregateQuotes } from "./aggregateQuotes"
import { AggregatedQuoteError } from "./errors/aggregatedQuoteError"

describe("aggregateQuotes()", () => {
  const defaultQuoteParams = {
    defuse_asset_identifier_in: "foo",
    defuse_asset_identifier_out: "bar",
  }

  it("aggregates quotes correctly", async () => {
    const quotes = await Promise.allSettled([
      Promise.resolve<solverRelay.Quote>({
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "1000000", // 1.0 with 6 decimals
        amount_out: "2000000", // 2.0 with 6 decimals
        expiration_time: "2024-01-15T12:05:00.000Z",
      }),
      Promise.resolve<solverRelay.Quote>({
        quote_hash: "q2",
        defuse_asset_identifier_in: "token2",
        defuse_asset_identifier_out: "tokenOut",
        amount_in: "100000000", // 1.0 with 8 decimals
        amount_out: "1000000", // 1.0 with 6 decimals
        expiration_time: "2024-01-15T12:04:00.000Z",
      }),
    ])

    const result = aggregateQuotes(quotes, [
      defaultQuoteParams,
      defaultQuoteParams,
    ])

    expect(result).toEqual({
      expirationTime: "2024-01-15T12:04:00.000Z",
      quoteHashes: ["q1", "q2"],
      tokenDeltas: [
        ["token1", -1000000n],
        ["tokenOut", 2000000n],
        ["token2", -100000000n],
        ["tokenOut", 1000000n],
      ],
      quoteParams: [defaultQuoteParams, defaultQuoteParams],
      isSimulation: false,
      fillStatus: "FULL",
    })
  })

  it("continues with valid quotes even when some quotes have failed", async () => {
    const quotes = await Promise.allSettled([
      Promise.reject<solverRelay.Quote>(
        new QuoteError({
          quote: {
            type: "INSUFFICIENT_AMOUNT",
            min_amount: "1000000",
          },
          quoteParams: defaultQuoteParams,
        })
      ),
      Promise.resolve<solverRelay.Quote>({
        quote_hash: "q1",
        defuse_asset_identifier_in: "token1",
        defuse_asset_identifier_out: "token2",
        amount_in: "1000000",
        amount_out: "2000000",
        expiration_time: "2024-01-15T12:05:00.000Z",
      }),
    ])

    const result = aggregateQuotes(quotes, [
      defaultQuoteParams,
      defaultQuoteParams,
    ])

    expect(result).toEqual({
      quoteHashes: ["q1"],
      expirationTime: "2024-01-15T12:05:00.000Z",
      tokenDeltas: [
        ["token1", -1000000n],
        ["token2", 2000000n],
      ],
      quoteParams: [defaultQuoteParams],
      isSimulation: false,
      fillStatus: "PARTIAL",
      quoteErrors: [
        new QuoteError({
          quote: {
            type: "INSUFFICIENT_AMOUNT",
            min_amount: "1000000",
          },
          quoteParams: defaultQuoteParams,
        }),
      ],
    })
  })

  it("throws error when all quotes have failed", async () => {
    const quotes = await Promise.allSettled([
      Promise.reject<solverRelay.Quote>(
        new QuoteError({
          quote: {
            type: "INSUFFICIENT_AMOUNT" as const,
            min_amount: "1000000",
          },
          quoteParams: defaultQuoteParams,
        })
      ),
      Promise.reject<solverRelay.Quote>(
        new QuoteError({
          quote: null,
          quoteParams: defaultQuoteParams,
        })
      ),
    ])

    let err: unknown
    try {
      aggregateQuotes(quotes, [defaultQuoteParams, defaultQuoteParams])
    } catch (e) {
      err = e
    }

    expect(err).instanceOf(AggregatedQuoteError)
    expect(err).toHaveProperty("errors", [
      new QuoteError({
        quote: { type: "INSUFFICIENT_AMOUNT", min_amount: "1000000" },
        quoteParams: defaultQuoteParams,
      }),
      new QuoteError({
        quote: null,
        quoteParams: defaultQuoteParams,
      }),
    ])
  })

  it("returns NO_QUOTES when quotes array is empty", () => {
    expect(() => aggregateQuotes([], [])).toThrowError(AggregatedQuoteError)
  })
})
