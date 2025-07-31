import { describe, expect, it } from "vitest"
import type { TokenValue } from "../../../types/base"
import { checkInsufficientBalance as check } from "./makerForm"

describe("checkInsufficientBalance", () => {
  const balance: TokenValue = {
    amount: 100000000n, // 100
    decimals: 6,
  }

  it("empty input", () => {
    expect(check("", balance)).toBe(false)
  })

  it("invalid number format", () => {
    expect(check("abc", balance)).toBe(false)
    expect(check("1.2.3", balance)).toBe(false)
    expect(check("1-2", balance)).toBe(false)
    expect(check(".", balance)).toBe(false)
    expect(check("-", balance)).toBe(false)
  })

  it("insufficient balance", () => {
    expect(check("100.000001", balance)).toBe(true)
  })
})
