import type {
  PricesResponseSchema,
  ProcessedPriceData,
  SimpleMarketData,
} from "./coinPricesApiClient"

export const parsePriceData = (
  livePrices: typeof PricesResponseSchema
): ProcessedPriceData => {
  const prices: Record<string, number> = {}
  const marketData: Record<string, SimpleMarketData> = {}

  for (const [symbol, priceData] of Object.entries(livePrices)) {
    if (priceData && priceData.length > 0) {
      const latestPrice = priceData[priceData.length - 1][1]
      prices[symbol] = latestPrice
      const priceValues = priceData.map(([, price]: [string, number]) => price)

      marketData[symbol] = {
        prices: priceValues,
      }
    }
  }

  return { prices, marketData }
}
