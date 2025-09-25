import { describe, expect, it } from "vitest"
import {
  type FillResult,
  fillWithMinimalExchanges,
} from "./fillWithMinimalExchanges"
import type { TokenBalances, TokenValues } from "./fillWithMinimalExchanges"

describe("fillWithMinimalExchanges same decimals", () => {
  it("handles direct fills without exchanges", () => {
    const balances: TokenValues = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 500n, decimals: 18 },
      C: { amount: 200n, decimals: 18 },
    }
    const required: TokenBalances = {
      A: 500n,
      B: 300n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual({
      success: true,
      remainingBalances: {
        A: { amount: 500n, decimals: 18 },
        B: { amount: 200n, decimals: 18 },
        C: { amount: 200n, decimals: 18 },
      },
      steps: expect.arrayContaining([
        {
          fromToken: "A",
          toToken: "A",
          fromAmount: 500n,
          toAmount: 500n,
          fee: 0n,
        },
        {
          fromToken: "B",
          toToken: "B",
          fromAmount: 300n,
          toAmount: 300n,
          fee: 0n,
        },
      ]),
    })
  })

  it("performs single exchange when needed", () => {
    const balances = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 50n, decimals: 18 },
      C: { amount: 200n, decimals: 18 },
    }
    const required = {
      A: 500n,
      B: 100n,
    }

    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        remainingBalances: {
          A: { amount: 449n, decimals: 18 },
          B: { amount: 0n, decimals: 18 },
          C: { amount: 200n, decimals: 18 },
        },
      })
    )
  })

  it("fails when insufficient balance for exchange", () => {
    const balances: TokenValues = {
      A: { amount: 100n, decimals: 18 },
      B: { amount: 50n, decimals: 18 },
    }

    const required: TokenBalances = {
      A: 200n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(false)
  })

  it("handles multiple exchanges optimally", () => {
    const balances: TokenValues = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 10n, decimals: 18 },
      C: { amount: 10n, decimals: 18 },
      D: { amount: 1000n, decimals: 18 },
    }
    const required: TokenBalances = {
      B: 100n,
      C: 100n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result.steps).toMatchInlineSnapshot(`
      [
        {
          "fee": 0n,
          "fromAmount": 10n,
          "fromToken": "B",
          "toAmount": 10n,
          "toToken": "B",
        },
        {
          "fee": 1n,
          "fromAmount": 91n,
          "fromToken": "A",
          "toAmount": 90n,
          "toToken": "B",
        },
        {
          "fee": 0n,
          "fromAmount": 10n,
          "fromToken": "C",
          "toAmount": 10n,
          "toToken": "C",
        },
        {
          "fee": 1n,
          "fromAmount": 91n,
          "fromToken": "A",
          "toAmount": 90n,
          "toToken": "C",
        },
      ]
    `)
  })

  it("prefers using existing balances over exchanges", () => {
    const balances: TokenValues = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 50n, decimals: 18 },
      C: { amount: 200n, decimals: 18 },
    }
    const required: TokenBalances = {
      A: 500n,
      B: 45n, // Less than available balance
      C: 150n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    const bExchanges = result.steps.filter((step) => step.toToken === "B")
    expect(bExchanges).toHaveLength(1)
    expect(bExchanges[0]).toEqual(expect.objectContaining({ fee: 0n }))
  })

  it("handles edge case of empty balances", () => {
    const balances: TokenValues = {}
    const required: TokenBalances = {
      A: 100n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(false)
  })

  it("handles edge case of empty requirements", () => {
    const balances: TokenValues = {
      A: { amount: 100n, decimals: 18 },
    }
    const required: TokenBalances = {}
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result.steps).toHaveLength(0)
    expect(result.remainingBalances).toEqual(balances)
  })

  it("verifies fee calculation in exchanges", () => {
    const balances: TokenValues = {
      A: { amount: 500000n, decimals: 18 },
      B: { amount: 0n, decimals: 18 },
    }
    const required: TokenBalances = {
      B: 250000n,
    }
    const result = fillWithMinimalExchanges(balances, required, 30n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result.steps).toEqual([
      {
        fromToken: "A",
        toToken: "B",
        fromAmount: 250008n,
        toAmount: 250000n,
        fee: 8n,
      },
    ])
  })

  it("handles high fee scenarios", () => {
    const balances: TokenValues = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 0n, decimals: 18 },
    }

    const required: TokenBalances = {
      B: 100n,
    }
    const result = fillWithMinimalExchanges(balances, required, 50000n) // 5% fee

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result.steps).toEqual([
      {
        fromToken: "A",
        toToken: "B",
        fromAmount: 106n,
        toAmount: 100n,
        fee: 6n,
      },
    ])
  })

  it("preserves original balances object", () => {
    const balances: TokenValues = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 500n, decimals: 18 },
    }
    const originalBalances = { ...balances }
    const required: TokenBalances = {
      A: 300n,
    }

    fillWithMinimalExchanges(balances, required, 30n)
    expect(balances).toEqual(originalBalances)
  })

  it("handles zero fee", () => {
    const balances = {
      A: { amount: 400000n, decimals: 18 },
      B: { amount: 300000n, decimals: 18 },
      C: { amount: 0n, decimals: 18 },
    }
    const required = {
      C: 700000n,
    }

    const result = fillWithMinimalExchanges(balances, required, 0n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual(
      expect.objectContaining({
        success: true,
        remainingBalances: {
          A: { amount: 0n, decimals: 18 },
          B: { amount: 0n, decimals: 18 },
          C: { amount: 0n, decimals: 18 },
        },
      })
    )
  })

  it("splits into 3 different tokens", () => {
    const balances = {
      A: { amount: 1000n, decimals: 18 },
      B: { amount: 1000n, decimals: 18 },
      C: { amount: 1000n, decimals: 18 },
    }
    const required = {
      A: 2000n,
    }

    const result = fillWithMinimalExchanges(balances, required, 1n)

    expect(result.success).toBe(true)
    checkTotalOut(required, result)
    checkRemainingBalanceAmounts(balances, result)
  })
})

describe("fillWithMinimalExchanges different decimals", () => {
  it("same chain can cover", () => {
    const balances: TokenValues = {
      A: { amount: 100n, decimals: 18 },
      B: { amount: 500n, decimals: 8 },
      C: { amount: 200n, decimals: 18 },
    }
    const required: TokenBalances = {
      A: 50n,
    }
    const result = fillWithMinimalExchanges(balances, required, 20n)

    expect(result.success).toBe(true)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual({
      success: true,
      remainingBalances: {
        A: { amount: 50n, decimals: 18 },
        B: { amount: 500n, decimals: 8 },
        C: { amount: 200n, decimals: 18 },
      },
      steps: expect.arrayContaining([
        {
          fromToken: "A",
          toToken: "A",
          fromAmount: 50n,
          toAmount: 50n,
          fee: 0n,
        },
      ]),
    })
  })

  it("multi chain can cover, different decimals (with 2 chains)", () => {
    const balances: TokenValues = {
      A: { amount: 10012345678n, decimals: 18 },
      B: { amount: 50n, decimals: 8 },
      C: { amount: 200987654321n, decimals: 18 },
    }
    const required: TokenBalances = {
      A: 50000000000n,
    }
    const result = fillWithMinimalExchanges(balances, required, 20_0000n)

    expect(result.success).toBe(true)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual({
      remainingBalances: {
        A: { amount: 0n, decimals: 18 },
        B: { amount: 46n, decimals: 8 },
        C: { amount: 200987654321n, decimals: 18 },
      },
      steps: [
        {
          fromToken: "A",
          toToken: "A",
          fromAmount: 10012345678n,
          toAmount: 10012345678n,
          fee: 0n,
        },
        {
          fromToken: "B",
          toToken: "A",
          fromAmount: 4n,
          toAmount: 39987654322n,
          fee: 1n,
        },
      ],
      success: true,
    })
  })

  it("multi chain can cover, different decimals (with 3 chains)", () => {
    const balances: TokenValues = {
      A: { amount: 10012345678n, decimals: 18 },
      B: { amount: 3n, decimals: 8 },
      C: { amount: 30098765432n, decimals: 18 },
    }
    const required: TokenBalances = {
      A: 50000000000n,
    }
    const result = fillWithMinimalExchanges(balances, required, 20_0000n)

    expect(result.success).toBe(true)
    checkRemainingBalanceAmounts(balances, result)

    expect(result).toEqual({
      remainingBalances: {
        A: { amount: 0n, decimals: 18 },
        B: { amount: 0n, decimals: 8 },
        C: { amount: 5114197529n, decimals: 18 },
      },
      steps: [
        {
          fromToken: "A",
          toToken: "A",
          fromAmount: 10012345678n,
          toAmount: 10012345678n,
          fee: 0n,
        },
        {
          fromToken: "B",
          toToken: "A",
          fromAmount: 3n,
          toAmount: 20000000000n,
          fee: 1n,
        },
        {
          fromToken: "C",
          toToken: "A",
          fromAmount: 24984567903n,
          toAmount: 19987654322n,
          fee: 4996913581n,
        },
      ],
      success: true,
    })
  })

  it("multi chain can cover, different decimals (with 3 chains) example 2", () => {
    const balances = {
      A: { amount: 3n, decimals: 2 },
      B: { amount: 3n, decimals: 1 },
      C: { amount: 33n, decimals: 2 },
    }
    const required = {
      A: 36n,
    }

    const result = fillWithMinimalExchanges(balances, required, 1n)

    expect(result.success).toBe(true)
    checkRemainingBalanceAmounts(balances, result)
    expect(result).toEqual({
      remainingBalances: {
        A: { amount: 0n, decimals: 2 },
        B: { amount: 0n, decimals: 1 },
        C: { amount: 19n, decimals: 2 },
      },
      steps: [
        {
          fromToken: "A",
          toToken: "A",
          fromAmount: 3n,
          toAmount: 3n,
          fee: 0n,
        },
        {
          fromToken: "B",
          toToken: "A",
          fromAmount: 3n,
          toAmount: 20n,
          fee: 1n,
        },
        {
          fromToken: "C",
          toToken: "A",
          fromAmount: 14n,
          toAmount: 13n,
          fee: 1n,
        },
      ],
      success: true,
    })
  })

  it("multi chain can cover, different decimals (with 3 chains) failing due to fees problem, but amount is enough", () => {
    const balances = {
      A: { amount: 3n, decimals: 2 }, // 3n -> max available 3n
      B: { amount: 3n, decimals: 1 }, // 30n -> max available 20n
      C: { amount: 33n, decimals: 2 }, // 33n -> max available 32n
      // 66n -> max available sum 55n
    }
    // even though user has ~66n on A, it can cover max 55n
    const required = {
      A: 55n + 1n,
    }
    const result = fillWithMinimalExchanges(balances, required, 1n)

    expect(result.success).toBe(false)
  })
})

function checkTotalOut(required: TokenBalances, result: FillResult) {
  let totalOut = 0n
  for (const step of result.steps) {
    totalOut += step.toAmount
  }

  expect(totalOut).toEqual(sum(required))
}

function checkRemainingBalanceAmounts(
  balances: TokenValues,
  result: FillResult
) {
  let totalIn = 0n
  for (const step of result.steps) {
    totalIn += step.fromAmount
  }

  const balanceAmounts = Object.values(balances).map(
    (balance) => balance.amount
  ) as bigint[]
  const remainingBalanceAmounts = Object.values(result.remainingBalances).map(
    (balance) => balance.amount
  ) as bigint[]
  expect(sum(remainingBalanceAmounts) + totalIn).toEqual(sum(balanceAmounts))
}

function sum(balances: TokenBalances | bigint[]) {
  return Object.values(balances).reduce((acc, x) => acc + x, 0n)
}
