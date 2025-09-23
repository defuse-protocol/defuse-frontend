import { describe, expect, it } from "vitest"
import { computeOppositeSideTokenDiff } from "./deriveTradeTerms"

describe("computeOppositeSideTokenDiff()", () => {
  it("returns a token diff accounted for fee", () => {
    const result = computeOppositeSideTokenDiff(
      { usdc: -1_000_000n, usdt: 1_000_000n },
      1
    )
    expect(result).toEqual({ usdc: 999_999n, usdt: -1_000_002n })
  })
})
