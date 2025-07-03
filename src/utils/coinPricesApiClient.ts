import { z } from "zod"

import { logger } from "@src/utils/logger"

import { COIN_PRICES_API_BASE_URL, COIN_PRICES_API_KEY } from "./environment"

export const PriceDataSchema = z.object({
  timestamp: z.string(),
  usd_price: z.number(),
})

export const PricesResponseSchema = z.record(
  z.string(), // symbol
  z.array(z.tuple([z.string(), z.number()])) // [timestamp, price]
)

export const MarketCapsResponseSchema = z.record(
  z.string(), // symbol
  z.number() // market cap
)

export interface SimpleMarketData {
  prices: number[]
}

export interface ProcessedPriceData {
  prices: Record<string, number>
  marketData: Record<string, SimpleMarketData>
}

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const { href } = new URL(endpoint, COIN_PRICES_API_BASE_URL)

  logger.info(`Coin Prices API request ${href}`)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(COIN_PRICES_API_KEY && {
      Authorization: `Bearer ${COIN_PRICES_API_KEY}`,
    }),
  }

  if (init?.headers) {
    Object.assign(headers, init.headers)
  }

  const res = await fetch(href, {
    cache: "no-store",
    method: "GET",
    headers,
    ...init,
  })

  const data = (await res.json()) as T

  if (!res.ok) {
    throw new Error(`Coin Prices API call failed [${res.status}]: ${endpoint}`)
  }

  return data
}

export const coinPricesApiClient = {
  getPrices: async (symbols: string, days?: string, months?: string) =>
    request<typeof PricesResponseSchema>(
      `/prices?symbols=${symbols}&days=${days}&months=${months}`
    ),

  getMarketCaps: async () =>
    request<typeof MarketCapsResponseSchema>("/market-caps"),
}
