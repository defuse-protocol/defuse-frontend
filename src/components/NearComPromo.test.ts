import type { ChainType } from "@src/hooks/useConnectWallet"
import { describe, expect, it } from "vitest"
import { getNearComPromoVariant } from "./nearComPromoVariant"

const chainType = (value: string) => value as ChainType

describe("getNearComPromoVariant", () => {
  it("treats disconnected users as anonymous", () => {
    expect(getNearComPromoVariant(undefined)).toBe("anonymous")
  })

  it("keeps passkey users on the migration path", () => {
    expect(getNearComPromoVariant(chainType("webauthn"))).toBe("passkey")
  })

  it("identifies web3 wallet users", () => {
    expect(getNearComPromoVariant(chainType("near"))).toBe("wallet")
    expect(getNearComPromoVariant(chainType("evm"))).toBe("wallet")
    expect(getNearComPromoVariant(chainType("solana"))).toBe("wallet")
    expect(getNearComPromoVariant(chainType("ton"))).toBe("wallet")
    expect(getNearComPromoVariant(chainType("stellar"))).toBe("wallet")
    expect(getNearComPromoVariant(chainType("tron"))).toBe("wallet")
  })
})
