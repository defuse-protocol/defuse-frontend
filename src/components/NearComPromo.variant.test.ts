import { ChainType } from "@src/hooks/chainType"
import { describe, expect, it } from "vitest"
import { getNearComPromoVariant } from "./NearComPromo.variant"

describe("getNearComPromoVariant", () => {
  it("returns 'anonymous' when chainType is undefined", () => {
    expect(getNearComPromoVariant(undefined)).toBe("anonymous")
  })

  it("returns 'passkey' for WebAuthn", () => {
    expect(getNearComPromoVariant(ChainType.WebAuthn)).toBe("passkey")
  })

  it.each([
    ChainType.Near,
    ChainType.EVM,
    ChainType.Solana,
    ChainType.Ton,
    ChainType.Stellar,
    ChainType.Tron,
  ])("returns 'wallet' for %s", (chainType) => {
    expect(getNearComPromoVariant(chainType)).toBe("wallet")
  })
})
