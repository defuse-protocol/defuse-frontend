import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("getAppFeeRecipients", () => {
  const nearIntentsTemplate = "near-intents"
  const rabitswapTemplate = "rabitswap"
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env = { ...originalEnv }
    // Clear module cache to ensure fresh imports with new env values
    delete require.cache[require.resolve("@src/utils/getAppFeeRecipient")]
    delete require.cache[require.resolve("@src/utils/environment")]
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it("returns 50/50 split when both recipients exist", async () => {
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT = "intents.near"
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT_RABITSWAP = "rabitswap.near"

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(rabitswapTemplate)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      recipient: "intents.near",
      shareBps: 5000,
    })
    expect(result[1]).toEqual({
      recipient: "rabitswap.near",
      shareBps: 5000,
    })
  })

  it("returns single recipient for templates without template-specific configuration", async () => {
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT = "intents.near"
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT_RABITSWAP = "rabitswap.near"

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(nearIntentsTemplate)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      recipient: "intents.near",
      shareBps: 10000,
    })
  })

  it("returns available recipient when only one is configured", async () => {
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT = "intents.near"
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT_RABITSWAP = ""

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(rabitswapTemplate)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      recipient: "intents.near",
      shareBps: 10000,
    })
  })

  it("returns empty array when no recipients configured", async () => {
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT = ""
    process.env.NEXT_PUBLIC_APP_FEE_RECIPIENT_RABITSWAP = ""

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(rabitswapTemplate)

    expect(result).toHaveLength(0)
  })
})
