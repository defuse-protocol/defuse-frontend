import { describe, expect, it } from "vitest"
import type { z } from "zod"
import type { PricesResponseSchema } from "./coinPricesApiClient"
import { parsePriceData } from "./parsePriceData"

describe("parsePriceData", () => {
  it("should parse valid price data correctly", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [
        ["2024-01-01T00:00:00Z", 45000],
        ["2024-01-01T01:00:00Z", 46000],
        ["2024-01-01T02:00:00Z", 47000],
      ],
      ETH: [
        ["2024-01-01T00:00:00Z", 3000],
        ["2024-01-01T01:00:00Z", 3100],
      ],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: 47000,
      ETH: 3100,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [45000, 46000, 47000],
      },
      ETH: {
        prices: [3000, 3100],
      },
    })
  })

  it("should handle empty price data", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {}

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({})
    expect(result.marketData).toEqual({})
  })

  it("should handle symbols with empty price arrays", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [],
      ETH: [
        ["2024-01-01T00:00:00Z", 3000],
        ["2024-01-01T01:00:00Z", 3100],
      ],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      ETH: 3100,
    })

    expect(result.marketData).toEqual({
      ETH: {
        prices: [3000, 3100],
      },
    })
  })

  it("should handle single price point per symbol", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [["2024-01-01T00:00:00Z", 45000]],
      ETH: [["2024-01-01T00:00:00Z", 3000]],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: 45000,
      ETH: 3000,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [45000],
      },
      ETH: {
        prices: [3000],
      },
    })
  })

  it("should handle negative prices", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [
        ["2024-01-01T00:00:00Z", -100],
        ["2024-01-01T01:00:00Z", -200],
      ],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: -200,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [-100, -200],
      },
    })
  })

  it("should handle zero prices", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [
        ["2024-01-01T00:00:00Z", 0],
        ["2024-01-01T01:00:00Z", 100],
      ],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: 100,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [0, 100],
      },
    })
  })

  it("should handle decimal prices", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [
        ["2024-01-01T00:00:00Z", 45000.123],
        ["2024-01-01T01:00:00Z", 46000.456],
      ],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: 46000.456,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [45000.123, 46000.456],
      },
    })
  })

  it("should handle mixed valid and invalid data", () => {
    const mockPricesData: z.infer<typeof PricesResponseSchema> = {
      BTC: [
        ["2024-01-01T00:00:00Z", 45000],
        ["2024-01-01T01:00:00Z", 46000],
      ],
      ETH: [],
      SOL: [["2024-01-01T00:00:00Z", 100]],
    }

    const result = parsePriceData(mockPricesData)

    expect(result.prices).toEqual({
      BTC: 46000,
      SOL: 100,
    })

    expect(result.marketData).toEqual({
      BTC: {
        prices: [45000, 46000],
      },
      SOL: {
        prices: [100],
      },
    })
  })
})
