import * as v from "valibot"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mockEnvValues = {
  APP_FEE_RECIPIENT: "",
  APP_FEE_RECIPIENT_RABITSWAP: "",
}

vi.mock("@src/utils/environment", () => ({
  get APP_FEE_RECIPIENT() {
    return v.parse(v.optional(v.string(), ""), mockEnvValues.APP_FEE_RECIPIENT)
  },
  get APP_FEE_RECIPIENT_RABITSWAP() {
    return v.parse(
      v.optional(v.string(), ""),
      mockEnvValues.APP_FEE_RECIPIENT_RABITSWAP
    )
  },
}))

describe("getAppFeeRecipients", () => {
  const nearIntentsTemplate = "near-intents"
  const rabitswapTemplate = "rabitswap"

  beforeEach(() => {
    mockEnvValues.APP_FEE_RECIPIENT = ""
    mockEnvValues.APP_FEE_RECIPIENT_RABITSWAP = ""
  })

  it("returns 50/50 split when both recipients exist", async () => {
    mockEnvValues.APP_FEE_RECIPIENT = "intents.near"
    mockEnvValues.APP_FEE_RECIPIENT_RABITSWAP = "rabitswap.near"

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(rabitswapTemplate)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ recipient: "intents.near", shareBps: 5000 })
    expect(result[1]).toEqual({ recipient: "rabitswap.near", shareBps: 5000 })
  })

  it("returns single recipient for templates without template-specific configuration", async () => {
    mockEnvValues.APP_FEE_RECIPIENT = "intents.near"
    mockEnvValues.APP_FEE_RECIPIENT_RABITSWAP = "rabitswap.near"

    const { getAppFeeRecipients } = await import(
      "@src/utils/getAppFeeRecipient"
    )
    const result = getAppFeeRecipients(nearIntentsTemplate)

    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ recipient: "intents.near", shareBps: 10000 })
  })
})
