import type CoinGecko from "coingecko-api"

import { logger } from "@src/utils/logger"

const COINGECKO_BASE_URL = "https://api.coingecko.com/"

export type MarketDataReturnType = {
  prices: [number, number][]
  market_caps: [number, number][]
  total_volumes: [number, number][]
}

const request = async <T>(endpoint: string, init?: RequestInit): Promise<T> => {
  const { href } = new URL(endpoint, COINGECKO_BASE_URL)

  logger.info(`CoinGecko API request ${href})`)

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (init?.headers) {
    Object.assign(headers, init.headers)
  }

  if (process.env.COINGECKO_API_KEY) {
    headers["x-cg-api-key"] = process.env.COINGECKO_API_KEY
  }

  const res = await fetch(href, {
    cache: "no-store",
    method: "GET",
    headers,
    ...init,
  })

  const data = (await res.json()) as T

  if (!res.ok) {
    throw new Error(`CoinGecko API call failed [${res.status}]: ${endpoint}`)
  }

  logger.info(`CoinGecko API response ${href} ${data}`)

  return data
}

export const coinGeckoApiClient = {
  getCoin: async (id: string) =>
    request<Promise<Awaited<ReturnType<CoinGecko["coins"]["fetch"]>>["data"]>>(
      `/api/v3/coins/${id}`
    ),

  // ids - string. Multiple ids can be passed separated by commas.
  // vs_currencies - string
  getUsdPrice: async (ids: string) =>
    await request<
      Promise<Awaited<ReturnType<CoinGecko["simple"]["price"]>>["data"]>
    >(`/api/v3/simple/price?ids=${ids}&vs_currencies=usd`),

  getTokenMarketData: async (id: string) =>
    await request<Promise<MarketDataReturnType>>(
      `/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`
    ),
}
