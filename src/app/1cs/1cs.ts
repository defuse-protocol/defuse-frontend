"use server"

import {
  OneClickService,
  OpenAPI,
  type QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"

// Initialize the API client
OpenAPI.BASE = "https://1click.chaindefuser.com"

// Configure your JSON Web Token (JWT) - required for most endpoints
// Request one here:
// https://docs.google.com/forms/d/e/1FAIpQLSdrSrqSkKOMb_a8XhwF0f7N5xZ0Y5CYgyzxiAuoC2g4a2N68g/viewform
OpenAPI.TOKEN =
  process.env.ONE_CLICK_API_KEY ??
  (() => {
    throw new Error("ONE_CLICK_API_KEY is not set")
  })()

const unusedTokens = [
  "nep141:853d955acef822db058eb8505911ed77f175b99e.factory.bridge.near",
  "nep141:base-0xa5c67d8d37b88c2d88647814da5578128e2c93b2.omft.near",
  "nep141:2260fac5e5542a773aa44fbcfedf7c193bc2c599.factory.bridge.near",
  "nep141:test-token.highdome3013.near",
]

export async function getTokens() {
  return (await OneClickService.getTokens()).filter(
    (token) => !unusedTokens.includes(token.assetId)
  )
}

// Create a quote request
// See docs for more info:
// https://docs.near-intents.org/near-intents/integration/distribution-channels/1click-api#post-v0-quote
// const quoteRequest: QuoteRequest = {
//   dry: true, // set to true for testing / false to get `depositAddress` and execute swap
//   swapType: QuoteRequest.swapType.EXACT_INPUT,
//   slippageTolerance: 100, // 1%
//   originAsset:
//     "nep141:arb-0xaf88d065e77c8cc2239327c5edb3a432268e5831.omft.near", // USDC on Arbitrum
//   depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
//   destinationAsset:
//     "nep141:sol-5ce3bf3a31af18be40ba30f721101b4341690186.omft.near", // USDC on Solana
//   amount: "1000000", // 1 USDC (in smallest units)
//   refundTo: "0x2527D02599Ba641c19FEa793cD0F167589a0f10D", // Valid Arbitrum address
//   refundType: QuoteRequest.refundType.ORIGIN_CHAIN,
//   recipient: "13QkxhNMrTPxoCkRdYdJ65tFuwXPhL5gLS2Z5Nr6gjRK", // Valid Solana Address
//   recipientType: QuoteRequest.recipientType.DESTINATION_CHAIN,
//   deadline: "2025-08-06T14:15:22Z",
// }

// // Get quote
// const quote = await OneClickService.getQuote(quoteRequest)

export async function getQuote(
  quoteRequest: QuoteRequest
): Promise<QuoteResponse> {
  const response = await fetch(`${OpenAPI.BASE}/v0/quote`, {
    method: "POST",
    body: JSON.stringify(quoteRequest),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OpenAPI.TOKEN}`,
    },
  })

  const data = await response.json()

  // If the response is not ok (4xx, 5xx), throw an error with the message
  if (!response.ok) {
    throw new Error(
      data?.message || `HTTP ${response.status}: ${response.statusText}`
    )
  }

  return data
}
