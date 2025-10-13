import { assert, describe, expect, it } from "vitest"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import {
  adjustDecimals,
  computeTotalBalanceDifferentDecimals,
} from "../../utils/tokenUtils"
import {
  calculateSplitAmounts,
  sortForOptimalAmountSplitting,
} from "./calculateSplitAmounts"
import { AmountMismatchError } from "./errors/amountMismatchError"

const tokenInfo: BaseTokenInfo = {
  defuseAssetId: "",
  symbol: "",
  name: "",
  decimals: 0,
  icon: "",
  originChainName: "eth",
  deployments: [
    {
      chainName: "eth",
      bridge: "poa",
      decimals: 0,
      address: "",
    },
  ],
}

const token1 = {
  ...tokenInfo,
  defuseAssetId: "token1",
  decimals: 6,
}
const token2 = {
  ...tokenInfo,
  defuseAssetId: "token2",
  decimals: 8,
}
const token3 = {
  ...tokenInfo,
  defuseAssetId: "token3",
  decimals: 18,
}

describe("sortForOptimalAmountSplitting", () => {
  const balances = {
    tokenA: BigInt(500),
    tokenB: BigInt(1000),
    tokenC: BigInt(200),
  }

  const uniqueTokensIn: BaseTokenInfo[] = [
    { ...tokenInfo, defuseAssetId: "tokenA", decimals: 2 },
    { ...tokenInfo, defuseAssetId: "tokenB", decimals: 4 },
    { ...tokenInfo, defuseAssetId: "tokenC", decimals: 2 },
  ]

  it("should sort tokens by decimals in ascending order first", () => {
    const result = sortForOptimalAmountSplitting(uniqueTokensIn, balances)

    // Expecting to see the tokens sorted by decimals: 2 -> 2 -> 4
    expect(result[0]?.decimals).toBe(2)
    expect(result[1]?.decimals).toBe(2)
    expect(result[2]?.decimals).toBe(4)
  })

  it("should sort by balances when decimals are equal", () => {
    // Changing the balances so we can test balance sorting
    const updatedBalances = {
      ...balances,
      tokenC: BigInt(500), // Smaller balance for tokenC
      tokenA: BigInt(1000), // Larger balance for tokenA
    }

    const result = sortForOptimalAmountSplitting(
      uniqueTokensIn,
      updatedBalances
    )

    // Tokens with the same decimals should be sorted by balance: tokenA > tokenC
    expect(result[0]?.defuseAssetId).toBe("tokenA")
    expect(result[1]?.defuseAssetId).toBe("tokenC")
    expect(result[2]?.defuseAssetId).toBe("tokenB")
  })

  it("should return the tokens in order when balances are missing", () => {
    const balancesWithoutTokenB = {
      tokenA: BigInt(500),
      tokenC: BigInt(200),
    }

    const result = sortForOptimalAmountSplitting(
      uniqueTokensIn,
      balancesWithoutTokenB
    )

    // If balances for a token are missing, it should still sort by decimals first
    expect(result[0]?.defuseAssetId).toBe("tokenA")
    expect(result[1]?.defuseAssetId).toBe("tokenC")
    expect(result[2]?.defuseAssetId).toBe("tokenB")
  })

  it("should return empty array if no tokens are provided", () => {
    const result = sortForOptimalAmountSplitting([], balances)
    expect(result).toEqual([])
  })

  it("should handle large and small balances correctly", () => {
    const largeBalances = {
      tokenA: BigInt(999999999),
      tokenB: BigInt(1),
    }

    const largeUniqueTokensIn = [
      { ...tokenInfo, defuseAssetId: "tokenA", decimals: 5 },
      { ...tokenInfo, defuseAssetId: "tokenB", decimals: 2 },
    ]

    const result = sortForOptimalAmountSplitting(
      largeUniqueTokensIn,
      largeBalances
    )

    // Sort by decimals first, then by balance
    expect(result[0]?.defuseAssetId).toBe("tokenB")
    expect(result[1]?.defuseAssetId).toBe("tokenA")
  })
})

describe("calculateSplitAmounts", () => {
  it("splits amounts when same decimals", () => {
    const tokensIn = [
      { ...token1, decimals: 0 },
      { ...token2, decimals: 0 },
      { ...token3, decimals: 0 },
    ]
    const amountIn = { amount: 150n, decimals: 0 }
    const balances = {
      token1: 100n,
      token2: 50n,
      token3: 120n,
    }
    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token3: 120n,
      token1: 30n,
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("splits amounts when different decimals", () => {
    const tokensIn = [token1, token2, token3]
    const amountIn = { amount: adjustDecimals(150n, 0, 6), decimals: 6 }
    const balances = {
      token1: adjustDecimals(100n, 0, token1.decimals),
      token2: adjustDecimals(50n, 0, token2.decimals),
      token3: adjustDecimals(200n, 0, token3.decimals),
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token1: 100_000_000n,
      token2: 5_000_000_000n,
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("only considers each token's balance once when duplicated", () => {
    const tokensIn = [token1, token1, token2, token2, token3]
    const amountIn = { amount: adjustDecimals(150n, 0, 6), decimals: 6 }
    const balances = {
      token1: adjustDecimals(100n, 0, token1.decimals),
      token2: adjustDecimals(50n, 0, token2.decimals),
      token3: adjustDecimals(200n, 0, token3.decimals),
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token1: 100_000_000n,
      token2: 5_000_000_000n,
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles zero amount input", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: 0n, decimals: 6 }
    const balances = {
      token1: adjustDecimals(100n, 0, token1.decimals),
      token2: adjustDecimals(50n, 0, token2.decimals),
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({})

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles missing balances", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: 100n, decimals: 6 } // 0.0001 with 6 decimals
    const balances = {
      token2: 50_000_000n, // 0.5 with 8 decimals
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token2: 10_000n, // 0.0001 with 8 decimals
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles extreme decimal differences", () => {
    const smallDecimals = { ...token1, decimals: 0 }
    const largeDecimals = { ...token2, decimals: 24 }
    const tokensIn = [smallDecimals, largeDecimals]
    const amountIn = { amount: 100n, decimals: 12 } // 0.0000000001 with 12 decimals
    const balances = {
      [smallDecimals.defuseAssetId]: 1n,
      [largeDecimals.defuseAssetId]: 1_000_000_000_000_000_000_000_000n, // 1 with 24 decimals
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      [largeDecimals.defuseAssetId]: 100_000_000_000_000n, // 0.0000000001 with 24 decimals
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles very large numbers without overflow", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: adjustDecimals(2n ** 64n, 0, 6), decimals: 6 }
    const balances = {
      token1: adjustDecimals(2n ** 64n, 0, token1.decimals) / 2n,
      token2: adjustDecimals(2n ** 64n, 0, token2.decimals) / 2n,
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual(balances)

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles different decimal precision between amount and tokens", () => {
    const tokensIn = [
      { ...token1, decimals: 18 },
      { ...token2, decimals: 6 },
    ]
    const amountIn = { amount: 1_000_000_000n, decimals: 12 } // 0.000001 with 12 decimals
    const balances = {
      token1: 1_000_000_000_000_000_000n, // 1 with 18 decimals
      token2: 1_000_000n, // 1 with 6 decimals
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token2: 1_000n,
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("handles token duplicates", () => {
    const tokensIn = [{ ...token1 }, { ...token1 }, token2]
    const amountIn = { amount: adjustDecimals(200n, 0, 6), decimals: 6 }
    const balances = {
      token1: adjustDecimals(100n, 0, token1.decimals),
      token2: adjustDecimals(100n, 0, token2.decimals),
    }

    const result = calculateSplitAmounts(tokensIn, amountIn, balances)
    expect(result).toEqual({
      token1: 100_000_000n,
      token2: 10_000_000_000n,
    })

    const total = sumTotal(tokensIn, result)
    expect(
      adjustDecimals(total.amount, total.decimals, amountIn.decimals)
    ).toEqual(amountIn.amount)
  })

  it("throws AmountMismatchError when available amount is less than requested", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: adjustDecimals(200n, 0, 6), decimals: 6 }
    const balances = {
      token1: adjustDecimals(100n, 0, token1.decimals),
      token2: adjustDecimals(50n, 0, token2.decimals),
    }

    try {
      calculateSplitAmounts(tokensIn, amountIn, balances)
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AmountMismatchError)
      expect(err).toEqual(
        expect.objectContaining({
          requested: { amount: 200000000n, decimals: 6 },
          fulfilled: { amount: 150000000n, decimals: 6 },
          shortfall: { amount: 50000000n, decimals: 6 },
          nextFulfillable: null,
          overage: null,
        })
      )
    }

    expect.assertions(2)
  })

  it("throws AmountMismatchError when balances are zero", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: 100n, decimals: 6 }
    const balances = {
      token1: 0n,
      token2: 0n,
    }

    try {
      calculateSplitAmounts(tokensIn, amountIn, balances)
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AmountMismatchError)
      expect(err).toEqual(
        expect.objectContaining({
          requested: { amount: 100n, decimals: 6 },
          fulfilled: { amount: 0n, decimals: 6 },
          shortfall: { amount: 100n, decimals: 6 },
          nextFulfillable: null,
          overage: null,
        })
      )
    }

    expect.assertions(2)
  })

  it("throws AmountMismatchError when no balances available", () => {
    const tokensIn = [token1, token2]
    const amountIn = { amount: 100n, decimals: 6 }
    const balances = {}

    try {
      calculateSplitAmounts(tokensIn, amountIn, balances)
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AmountMismatchError)
      expect(err).toEqual(
        expect.objectContaining({
          requested: { amount: 100n, decimals: 6 },
          fulfilled: { amount: 0n, decimals: 6 },
          shortfall: { amount: 100n, decimals: 6 },
          nextFulfillable: null,
          overage: null,
        })
      )
    }
  })

  it("throws AmountMismatchError when tokens array is empty", () => {
    const tokensIn: (typeof token1)[] = []
    const amountIn = { amount: 100n, decimals: 6 }
    const balances = {}

    try {
      calculateSplitAmounts(tokensIn, amountIn, balances)
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AmountMismatchError)
      expect(err).toEqual(
        expect.objectContaining({
          requested: { amount: 100n, decimals: 6 },
          fulfilled: { amount: 0n, decimals: 6 },
          shortfall: { amount: 100n, decimals: 6 },
          nextFulfillable: null,
          overage: null,
        })
      )
    }
  })

  it("throws AmountMismatchError when dust is requested", () => {
    const tokensIn = [
      { ...token1, decimals: 6 },
      { ...token2, decimals: 8 },
      { ...token3, decimals: 24 },
    ]
    const amountIn = { amount: 100n, decimals: 24 }
    const balances = {
      token1: adjustDecimals(1n, 0, 6),
      token2: adjustDecimals(1n, 0, 8),
      token3: 95n,
    }

    try {
      calculateSplitAmounts(tokensIn, amountIn, balances)
    } catch (err: unknown) {
      expect(err).toBeInstanceOf(AmountMismatchError)
      expect(err).toEqual(
        expect.objectContaining({
          requested: { amount: 100n, decimals: 24 },
          fulfilled: { amount: 95n, decimals: 24 },
          shortfall: { amount: 5n, decimals: 24 },
          nextFulfillable: { amount: 10n ** 24n, decimals: 24 },
          overage: { amount: 10n ** 24n - 100n, decimals: 24 },
        })
      )
    }
  })

  function sumTotal(
    tokensIn: BaseTokenInfo[],
    balances: Record<string, bigint>
  ): TokenValue {
    const a = computeTotalBalanceDifferentDecimals(
      tokensIn.filter((t) => Object.keys(balances).includes(t.defuseAssetId)),
      balances
    )
    assert(a != null)
    return a
  }
})
