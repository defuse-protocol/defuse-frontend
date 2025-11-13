import { beforeEach, describe, expect, it, vi } from "vitest"

describe("getAppFeeRecipient", () => {
  const nearIntentsWhitelabelTemplate = "near-intents"
  const rabitswapWhitelabelTemplate = "rabitswap"

  beforeEach(() => {
    vi.resetModules()
  })

  it("should use rabitswap recipient for rabitswap domain if set", async () => {
    vi.doMock("@src/utils/environment", () => ({
      APP_FEE_RECIPIENT: "intents.near",
      APP_FEE_RECIPIENT_RABITSWAP: "rabitswap.near",
    }))

    const { getAppFeeRecipient } = await import("@src/utils/getAppFeeRecipient")
    const result = getAppFeeRecipient(rabitswapWhitelabelTemplate)
    expect(result).toBe("rabitswap.near")
  })

  it("should use default recipient for non-rabitswap domains", async () => {
    vi.doMock("@src/utils/environment", () => ({
      APP_FEE_RECIPIENT: "intents.near",
      APP_FEE_RECIPIENT_RABITSWAP: "rabitswap.near",
    }))

    const { getAppFeeRecipient } = await import("@src/utils/getAppFeeRecipient")
    const result = getAppFeeRecipient(nearIntentsWhitelabelTemplate)
    expect(result).toBe("intents.near")
  })

  it("should use default recipient for rabitswap domain when APP_FEE_RECIPIENT_RABITSWAP is not defined", async () => {
    vi.doMock("@src/utils/environment", () => ({
      APP_FEE_RECIPIENT: "intents.near",
      APP_FEE_RECIPIENT_RABITSWAP: undefined,
    }))

    const { getAppFeeRecipient } = await import("@src/utils/getAppFeeRecipient")
    const result = getAppFeeRecipient(rabitswapWhitelabelTemplate)
    expect(result).toBe("intents.near")
  })
})
