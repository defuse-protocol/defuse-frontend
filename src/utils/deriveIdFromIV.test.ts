import { describe, expect, it } from "vitest"
import { deriveIdFromIV } from "./deriveIdFromIV"

describe("deriveIdFromIV", () => {
  it("generates id deterministically", () => {
    const result1 = deriveIdFromIV("1234567890")
    // UUID v5 format: 8-4-4-4-12 hexadecimal characters
    expect(result1).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })

  it("generates same ID for same IV multiple times", () => {
    const iv = "test-iv-123"
    const result1 = deriveIdFromIV(iv)
    const result2 = deriveIdFromIV(iv)
    const result3 = deriveIdFromIV(iv)

    expect(result1).toEqual(result2)
    expect(result2).toEqual(result3)
    expect(result1).toEqual(result3)
  })

  it("generates different IDs for different IVs", () => {
    const iv1 = "test-iv-123"
    const iv2 = "test-iv-456"
    const iv3 = "test-iv-789"

    const result1 = deriveIdFromIV(iv1)
    const result2 = deriveIdFromIV(iv2)
    const result3 = deriveIdFromIV(iv3)

    expect(result1).not.toEqual(result2)
    expect(result2).not.toEqual(result3)
    expect(result1).not.toEqual(result3)
  })

  it("handles empty IV", () => {
    const result = deriveIdFromIV("")
    expect(result).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
    )
  })
})
