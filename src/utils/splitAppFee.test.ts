import type { Intent } from "@defuse-protocol/contract-types"
import { describe, expect, it } from "vitest"
import { splitAppFee, splitAppFeeBps } from "./splitAppFee"

type TransferIntent = {
  intent: "transfer"
  receiver_id: string
  tokens: {
    [k: string]: string
  }
}

function isTransferIntent(intent: Intent): intent is TransferIntent {
  return (
    intent.intent === "transfer" &&
    "receiver_id" in intent &&
    "tokens" in intent
  )
}

describe("splitAppFee", () => {
  it("splits 50/50 with even amount", () => {
    const appFee: [string, bigint][] = [["token1", 1000n]]
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFee(appFee, recipients)

    expect(result.primaryAppFee).toEqual([["token1", 500n]])
    expect(result.primaryRecipient).toBe("main.near")
    expect(result.transferIntents).toHaveLength(1)
    const transferIntent = result.transferIntents[0]
    expect(isTransferIntent(transferIntent)).toBe(true)
    const typedIntent = transferIntent as TransferIntent
    expect(typedIntent.receiver_id).toBe("rabitswap.near")
    expect(typedIntent.tokens.token1).toBe("500")
  })

  it("handles odd amounts without rounding loss", () => {
    const appFee: [string, bigint][] = [["token1", 1001n]]
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFee(appFee, recipients)

    const primaryAmount = result.primaryAppFee[0]?.[1] ?? 0n
    const transferIntent = result.transferIntents[0]
    expect(isTransferIntent(transferIntent)).toBe(true)
    const typedIntent = transferIntent as TransferIntent
    const secondaryAmount = BigInt(typedIntent.tokens.token1 || "0")

    expect(primaryAmount).toBe(500n)
    expect(secondaryAmount).toBe(501n)
    expect(primaryAmount + secondaryAmount).toBe(1001n)
  })

  it("returns all fees to single recipient when only one recipient provided", () => {
    const appFee: [string, bigint][] = [["token1", 1000n]]
    const recipients = [{ recipient: "main.near", shareBps: 10000 }]

    const result = splitAppFee(appFee, recipients)

    expect(result.primaryAppFee).toEqual([["token1", 1000n]])
    expect(result.primaryRecipient).toBe("main.near")
    expect(result.transferIntents).toHaveLength(0)
  })

  it("handles very small amounts without rounding loss", () => {
    const appFee: [string, bigint][] = [["token1", 3n]]
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFee(appFee, recipients)

    const primaryAmount = result.primaryAppFee[0]?.[1] ?? 0n
    const transferIntent = result.transferIntents[0]
    expect(isTransferIntent(transferIntent)).toBe(true)
    const typedIntent = transferIntent as TransferIntent
    const secondaryAmount = BigInt(typedIntent.tokens.token1 || "0")

    expect(primaryAmount).toBe(1n)
    expect(secondaryAmount).toBe(2n)
    expect(primaryAmount + secondaryAmount).toBe(3n)
  })

  it("handles zero fee amount", () => {
    const appFee: [string, bigint][] = [["token1", 0n]]
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFee(appFee, recipients)

    expect(result.primaryAppFee).toHaveLength(0)
    expect(result.transferIntents).toHaveLength(0)
  })

  it("throws error when no recipients provided", () => {
    const appFee: [string, bigint][] = [["token1", 1000n]]
    const recipients: Array<{ recipient: string; shareBps: number }> = []

    expect(() => splitAppFee(appFee, recipients)).toThrow(
      "At least one recipient is required"
    )
  })

  it("throws error when more than 2 recipients provided", () => {
    const appFee: [string, bigint][] = [["token1", 1000n]]
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "secondary1.near", shareBps: 3000 },
      { recipient: "secondary2.near", shareBps: 2000 },
    ]

    expect(() => splitAppFee(appFee, recipients)).toThrow(
      "Only 1 or 2 recipients are supported"
    )
  })
})

describe("splitAppFeeBps", () => {
  it("returns all BPS to single recipient when only one recipient provided", () => {
    const appFeeBps = 100
    const recipients = [{ recipient: "main.near", shareBps: 10000 }]

    const result = splitAppFeeBps(appFeeBps, recipients)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      recipient: "main.near",
      fee: 100,
    })
  })

  it("splits 50/50 with even BPS amount", () => {
    const appFeeBps = 100
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFeeBps(appFeeBps, recipients)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      recipient: "main.near",
      fee: 50,
    })
    expect(result[1]).toEqual({
      recipient: "rabitswap.near",
      fee: 50,
    })

    const total = result.reduce((sum, r) => sum + r.fee, 0)
    expect(total).toBe(100)
  })

  it("handles odd BPS amounts without rounding loss", () => {
    const appFeeBps = 101
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFeeBps(appFeeBps, recipients)

    const total = result.reduce((sum, r) => sum + r.fee, 0)
    expect(total).toBe(101)
    expect(result[0]?.fee).toBe(51)
    expect(result[1]?.fee).toBe(50)
  })

  it("throws error when more than 2 recipients provided", () => {
    const appFeeBps = 100
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "secondary1.near", shareBps: 3000 },
      { recipient: "secondary2.near", shareBps: 2000 },
    ]

    expect(() => splitAppFeeBps(appFeeBps, recipients)).toThrow(
      "Only 1 or 2 recipients are supported"
    )
  })

  it("handles very small BPS amounts without rounding loss", () => {
    const appFeeBps = 3
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFeeBps(appFeeBps, recipients)

    const total = result.reduce((sum, r) => sum + r.fee, 0)
    expect(total).toBe(3)
    expect(result[0]?.fee).toBe(2)
    expect(result[1]?.fee).toBe(1)
  })

  it("returns empty array when BPS is zero", () => {
    const appFeeBps = 0
    const recipients = [
      { recipient: "main.near", shareBps: 5000 },
      { recipient: "rabitswap.near", shareBps: 5000 },
    ]

    const result = splitAppFeeBps(appFeeBps, recipients)

    expect(result).toHaveLength(0)
  })

  it("throws error when no recipients provided", () => {
    const appFeeBps = 100
    const recipients: Array<{ recipient: string; shareBps: number }> = []

    expect(() => splitAppFeeBps(appFeeBps, recipients)).toThrow(
      "At least one recipient is required"
    )
  })
})
