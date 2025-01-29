import { describe, expect, it } from "vitest"
import { bannedNearAddress, isBannedNearAddress } from "./bannedNearAddress"

describe("bannedNearAddress", () => {
  it("should ensure all banned addresses are in lowercase", () => {
    for (const address of bannedNearAddress) {
      expect(address).toBe(address.toLowerCase())
    }
  })

  it("should identify banned near address", () => {
    const bannedAddress = "0x0000000000000000000000000000000000000000"
    expect(isBannedNearAddress(bannedAddress)).toBe(true)
  })

  it("should return false for non-banned near address", () => {
    expect(isBannedNearAddress("notbannedaddress")).toBe(false)
  })
})
