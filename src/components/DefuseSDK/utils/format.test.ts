import { describe, expect, it } from "vitest"
import { formatTokenValue } from "./format"

describe("formatTokenValue()", () => {
  describe("basic formatting", () => {
    it.each([
      [0, 18, "0"],
      [1000000000000000000n, 18, "1"],
      [1234567890000000000n, 18, "1.23456789"], // 10 digits, show full
      [1002000000000000000n, 18, "1.002"],
    ])("formatTokenValue(%s, %s) => %s", (num, decimals, expected) => {
      expect(formatTokenValue(num, decimals)).toEqual(expected)
    })
  })

  describe("small values (< 1) - shows significant digits", () => {
    it.each([
      [167314n, 6, "0.167314"], // 7 digits, show full
      [1234n, 4, "0.1234"], // 5 digits, show full
      [123456n, 6, "0.123456"], // 7 digits, show full
      [169677343970239n, 18, "0.0001696773"], // 19 digits > 11, truncate to 11
      [100000000n, 18, "0.0000000001"], // 11 digits, show full
      [4n, 11, "0.00000000004"], // 12 digits > 11, but subscript boundary
      [12345n, 8, "0.00012345"], // 9 digits, show full
      [1n, 8, "0.00000001"], // 9 digits, show full
      [16967n, 8, "0.00016967"], // 9 digits, show full
    ])("formatTokenValue(%s, %s) => %s", (num, decimals, expected) => {
      expect(formatTokenValue(num, decimals)).toEqual(expected)
    })
  })

  describe("large values (>= 1)", () => {
    it.each([
      [12345678n, 4, "1234.5678"], // 8 digits, show full
      [123456789012345678n, 18, "0.12345678"], // 17 digits > 11, truncate
      [1234567890123456789n, 18, "1.2345678901"], // 19 digits > 11, truncate to 11
      [10000000000000n, 18, "0.00001"], // 6 digits, show full
    ])("formatTokenValue(%s, %s) => %s", (num, decimals, expected) => {
      expect(formatTokenValue(num, decimals)).toEqual(expected)
    })
  })

  describe("with explicit fractionDigits (backward compatible)", () => {
    it.each([
      [123, 0, 0, "123"],
      [123, 1, 0, "12"],
      [123, 1, 1, "12.3"],
      [123, 9, 3, "0"],
      [123, 9, 9, "0.000000123"],
      [1000000000, 9, 9, "1"],
      [1000000001, 9, 9, "1.000000001"],
      [1000000, 9, 9, "0.001"],
      [1234, 2, 1, "12.3"],
    ])(
      "formatTokenValue(%s, %s, { fractionDigits: %s }) => %s",
      (num, decimals, fractionDigits, expected) => {
        expect(formatTokenValue(num, decimals, { fractionDigits })).toEqual(
          expected
        )
      }
    )
  })

  describe("with min threshold (backward compatible)", () => {
    it.each([
      [1234, 2, 1000, "< 1000"],
      [123, 4, 0.1, "< 0.1"],
      [-123, 4, 0.1, "< -0.1"],
    ])(
      "formatTokenValue(%s, %s, { min: %s }) => %s",
      (num, decimals, min, expected) => {
        expect(formatTokenValue(num, decimals, { min })).toEqual(expected)
      }
    )
  })

  describe("negative values", () => {
    it("handles negative values", () => {
      expect(formatTokenValue(-169677343970239n, 18)).toEqual("-0.0001696773") // 11 digits
      expect(formatTokenValue(-4n, 11)).toEqual("-0.00000000004")
      expect(formatTokenValue(-1234567890000000000n, 18)).toEqual("-1.23456789") // 10 digits, show full
    })
  })

  describe("with significantDigits option", () => {
    it("allows customizing significant digits", () => {
      expect(
        formatTokenValue(169677343970239n, 18, { significantDigits: 4 })
      ).toEqual("0.0001696")
      expect(
        formatTokenValue(169677343970239n, 18, { significantDigits: 8 })
      ).toEqual("0.00016967734")
    })
  })

  describe("with maxDecimals option", () => {
    it("caps decimal places for large values", () => {
      expect(
        formatTokenValue(1234567890000000000n, 18, { maxDecimals: 2 })
      ).toEqual("1.23")
      expect(
        formatTokenValue(1234567890000000000n, 18, { maxDecimals: 6 })
      ).toEqual("1.23456")
    })
  })

  describe("with compact option", () => {
    it("formats large numbers in compact notation", () => {
      expect(
        formatTokenValue(1234567000000000000000n, 18, { compact: true })
      ).toEqual("1.23K")
      expect(
        formatTokenValue(1234567000000000000000000n, 18, { compact: true })
      ).toEqual("1.23M")
    })
  })

  describe("with locale option", () => {
    it("adds thousand separators", () => {
      expect(
        formatTokenValue(1234567890000000000000n, 18, { locale: true })
      ).toEqual("1,234.56")
    })
  })

  describe("edge cases", () => {
    it("handles boundary value 0.00001", () => {
      expect(formatTokenValue(10n, 6)).toEqual("0.00001") // USDC
      expect(formatTokenValue(10000000000000n, 18)).toEqual("0.00001") // ETH
    })

    it("handles very large numbers (999,999,999)", () => {
      expect(formatTokenValue(999999999000000n, 6)).toEqual("999999999") // USDC
      expect(formatTokenValue(999999999000000000000000000n, 18)).toEqual(
        "999999999"
      ) // ETH
    })

    it("formats same value consistently across different token decimals", () => {
      // 1.234567 in both USDC (6 dec) and ETH (18 dec) - 7 digits, show full
      expect(formatTokenValue(1234567n, 6)).toEqual("1.234567")
      expect(formatTokenValue(1234567000000000000n, 18)).toEqual("1.234567")
    })

    it("handles dust amounts (smallest possible values)", () => {
      expect(formatTokenValue(1n, 18)).toEqual("0.0₁₇1") // 1 wei - uses subscript notation
      expect(formatTokenValue(1n, 6)).toEqual("0.000001") // 1 unit USDC - within limit
      expect(formatTokenValue(10000000n, 18)).toEqual("0.00000000001") // 1e-11 ETH - at limit
    })

    it("uses subscript notation for very small values (>10 leading zeros)", () => {
      // 1 wei = 0.000000000000000001 ETH (17 leading zeros)
      expect(formatTokenValue(1n, 18)).toEqual("0.0₁₇1")
      // 12 wei = 0.000000000000000012 ETH
      expect(formatTokenValue(12n, 18)).toEqual("0.0₁₆12")
      // 123456 wei = 0.000000000000123456 ETH (12 leading zeros)
      expect(formatTokenValue(123456n, 18)).toEqual("0.0₁₂123456")
      // 10^7 wei = 0.00000000001 ETH (10 leading zeros) - at boundary, no subscript
      expect(formatTokenValue(10000000n, 18)).toEqual("0.00000000001")
    })

    it("fractionDigits takes priority over other options", () => {
      // fractionDigits overrides significantDigits
      expect(
        formatTokenValue(1234567890000000000n, 18, {
          fractionDigits: 2,
          significantDigits: 8,
        })
      ).toEqual("1.23")
    })
  })
})
