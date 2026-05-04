import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { describe, expect, it } from "vitest"
import {
  isValidAndWorseWithdrawQuote,
  isValidWithdrawQuote,
} from "./1csQuoteValidation"

describe("1csQuoteValidation", () => {
  it("returns true for a valid exact-input withdraw quote", () => {
    const result = isValidWithdrawQuote({
      quote1csResult: {
        ok: {
          quote: {
            amountIn: "1000",
            amountOut: "900",
            depositAddress: "deposit.near",
          },
        },
      },
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      requestedAmountIn: 1000n,
      inputAmountDecimals: 6,
      outputAmountDecimals: 6,
    })

    expect(result).toBe(true)
  })

  it("returns false when deposit address is missing", () => {
    const result = isValidWithdrawQuote({
      quote1csResult: {
        ok: {
          quote: {
            amountIn: "1000",
            amountOut: "900",
          },
        },
      },
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      requestedAmountIn: 1000n,
      inputAmountDecimals: 6,
      outputAmountDecimals: 6,
    })

    expect(result).toBe(false)
  })

  it("returns false for exact-output quote when output is below requested", () => {
    const result = isValidWithdrawQuote({
      quote1csResult: {
        ok: {
          quote: {
            amountIn: "1000000",
            amountOut: "999999999999999999",
            depositAddress: "deposit.near",
          },
        },
      },
      swapType: QuoteRequest.swapType.EXACT_OUTPUT,
      requestedAmountIn: 1000000n,
      inputAmountDecimals: 6,
      outputAmountDecimals: 18,
    })

    expect(result).toBe(false)
  })

  it("returns false for valid-and-worse check when quote is structurally invalid", () => {
    const result = isValidAndWorseWithdrawQuote({
      quote1csResult: {
        ok: {
          quote: {
            amountIn: "1000",
            amountOut: "100",
          },
        },
      },
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      requestedAmountIn: 1000n,
      inputAmountDecimals: 6,
      outputAmountDecimals: 6,
      previousOppositeAmount: 200n,
    })

    expect(result).toBe(false)
  })
})
