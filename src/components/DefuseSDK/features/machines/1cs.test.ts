import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { server } from "@src/tests/setup"
import { http, HttpResponse } from "msw"
import { describe, expect, it, vi } from "vitest"
import { type GetWithdrawQuoteArgs, getWithdrawQuote } from "./1cs"

vi.mock("next/cache", () => ({
  unstable_cache: vi.fn((fn) => fn),
}))

vi.mock("@src/config/featureFlags", () => ({
  whitelabelTemplateFlag: vi.fn(() => Promise.resolve("near-intents")),
}))

vi.mock("@src/utils/environment", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@src/utils/environment")>()
  return {
    ...actual,
    ONE_CLICK_URL: "https://1click.example.com",
    ONE_CLICK_API_KEY: "test-api-key",
    APP_FEE_BPS: 0,
  }
})

describe("getWithdrawQuote", () => {
  const validArgs: GetWithdrawQuoteArgs = {
    dry: false,
    slippageTolerance: 100,
    originAsset: "nep141:usdc.near",
    destinationAsset: "eth:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    amount: "1000000",
    deadline: new Date(Date.now() + 3600000).toISOString(),
    userAddress: "0x1234567890123456789012345678901234567890",
    authMethod: "evm",
    swapType: QuoteRequest.swapType.EXACT_INPUT,
    recipient: "0xabcdef1234567890abcdef1234567890abcdef12",
  }

  const mockQuoteResponse = {
    timestamp: new Date().toISOString(),
    signature: "mock-signature",
    quoteRequest: {
      ...validArgs,
      depositType: "INTENTS",
      refundType: "INTENTS",
      recipientType: "DESTINATION_CHAIN",
    },
    quote: {
      depositAddress: "intents:deposit-address",
      amountIn: "1000000",
      amountOut: "990000",
    },
  }

  it("returns quote with correct request parameters", async () => {
    let capturedRequest: Record<string, unknown> | null = null

    server.use(
      http.post("https://1click.example.com/v0/quote", async ({ request }) => {
        capturedRequest = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(mockQuoteResponse)
      })
    )

    const result = await getWithdrawQuote(validArgs)

    expect(result).toHaveProperty("ok")
    if ("ok" in result) {
      expect(result.ok.quote.depositAddress).toBe("intents:deposit-address")
    }

    expect(capturedRequest).toEqual(
      expect.objectContaining({
        depositType: "INTENTS",
        recipientType: "DESTINATION_CHAIN",
        refundType: "INTENTS",
        recipient: validArgs.recipient,
        refundTo: validArgs.userAddress.toLowerCase(),
      })
    )
  })

  it("returns error for invalid arguments", async () => {
    const invalidArgs = {
      ...validArgs,
      authMethod: "invalid" as "evm",
    }

    const result = await getWithdrawQuote(invalidArgs)

    expect(result).toHaveProperty("err")
    if ("err" in result) {
      expect(result.err).toContain("Invalid arguments")
    }
  })

  it("returns error when API request fails", async () => {
    server.use(
      http.post("https://1click.example.com/v0/quote", async () => {
        return HttpResponse.json(
          { body: { message: "Quote unavailable" } },
          { status: 400 }
        )
      })
    )

    const result = await getWithdrawQuote(validArgs)

    expect(result).toHaveProperty("err")
  })
})
