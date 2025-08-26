"use server"

import {
  OneClickService,
  OpenAPI,
  type QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { unstable_cache } from "next/cache"

OpenAPI.BASE =
  process.env.ONE_CLICK_URL ??
  (() => {
    throw new Error("ONE_CLICK_URL is not set")
  })()

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
  return await getTokensCached()
}

const getTokensCached = unstable_cache(
  async () => {
    return (await OneClickService.getTokens()).filter(
      (token) => !unusedTokens.includes(token.assetId)
    )
  },
  ["1click-tokens"],
  {
    revalidate: 60, // 1 minute cache
    tags: ["1click-tokens"],
  }
)

export async function getQuote(
  quoteRequest: QuoteRequest
): Promise<QuoteResponse | { error: string }> {
  const response = await fetch(`${OpenAPI.BASE}/v0/quote`, {
    method: "POST",
    body: JSON.stringify(quoteRequest),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OpenAPI.TOKEN}`,
    },
  })

  const data = await response.json()

  return response.ok
    ? data
    : {
        error:
          data?.message || `HTTP ${response.status}: ${response.statusText}`,
      }
}
