import { describe, expect, it } from "vitest"
import { isBannedNearAddress } from "./bannedNearAddress"

describe("bannedNearAddress", () => {
  it("should identify banned near addresses", () => {
    const bannedNearAddress = "0x0000000000000000000000000000000000000000"
    expect(isBannedNearAddress(bannedNearAddress)).toBe(true)
  })

  it("should handle case-insensitive addresses", () => {
    const bannedNearAddress = "0x0000000000000000000000000000000000000000"
    expect(isBannedNearAddress(bannedNearAddress.toUpperCase())).toBe(true)
  })

  it("should return false for non-banned near addresses", () => {
    expect(
      isBannedNearAddress("0x1234567890123456789012345678901234567890")
    ).toBe(false)
  })
})
