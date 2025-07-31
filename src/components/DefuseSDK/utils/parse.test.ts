import { expect, it } from "vitest"
import { parseUnits } from "./parse"

it("should parse number with decimals", () => {
  expect(parseUnits("1.000", 3)).toBe(1000n)
  expect(parseUnits("1,000", 3)).toBe(1000n)
  expect(() => parseUnits("1..000", 3)).toThrow()
  expect(() => parseUnits("1.,000", 3)).toThrow()
  expect(() => parseUnits("1,,000", 3)).toThrow()
  expect(() => parseUnits("", 1)).toThrow()
  expect(() => parseUnits(" ", 1)).toThrow()
})
