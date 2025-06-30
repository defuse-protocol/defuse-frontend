"use server"

import { supabase } from "@src/libs/supabase"
import { coinGeckoApiClient } from "@src/utils/coinGeckoApiClient"
import { coinGeckoIdBySymbol } from "@src/utils/coinGeckoTokenIds"
import { logger } from "@src/utils/logger"

export type CoinGeckoId = keyof typeof coinGeckoIdBySymbol

/**
 * Fetches current prices for all supported tokens from CoinGecko API
 * and saves them to the token_prices table in Supabase
 */
export async function fetchAndSaveTokenPrices() {
  try {
    logger.info("Starting token price fetch and save operation")

    // Get all supported token symbols from the mapping
    const supportedSymbols = Object.keys(coinGeckoIdBySymbol) as CoinGeckoId[]

    if (supportedSymbols.length === 0) {
      logger.warn("No supported tokens found in coinGeckoIdBySymbol mapping")
      return { success: false, error: "No supported tokens found" }
    }

    // Fetch current prices from CoinGecko API
    const coinGeckoIds = supportedSymbols.map(
      (symbol) => coinGeckoIdBySymbol[symbol]
    )
    const priceData = await coinGeckoApiClient.getUsdPrice(
      coinGeckoIds.join(",")
    )

    // Process the price data and prepare for database insertion
    const priceEntries: Array<{
      symbol: string
      price: number
      timestamp: string
    }> = []

    const currentTimestamp = new Date().toISOString()

    for (const [coinGeckoId, priceInfo] of Object.entries(priceData)) {
      if (
        priceInfo &&
        typeof priceInfo === "object" &&
        "usd" in priceInfo &&
        typeof priceInfo.usd === "number"
      ) {
        // Find the symbol for this coinGeckoId
        const symbol = supportedSymbols.find(
          (sym) => coinGeckoIdBySymbol[sym] === coinGeckoId
        )

        if (symbol) {
          // Convert price to integer (multiply by 100000000 to preserve 8 decimal places)
          const priceInCents = Math.round(priceInfo.usd * 100000000)

          priceEntries.push({
            symbol: symbol.toUpperCase(),
            price: priceInCents,
            timestamp: currentTimestamp,
          })
        }
      }
    }

    if (priceEntries.length === 0) {
      logger.warn("No valid price data found from CoinGecko API")
      return { success: false, error: "No valid price data found" }
    }

    // Insert price data into Supabase
    const { data, error } = await supabase
      .from("token_prices")
      .insert(priceEntries)
      .select()

    if (error) {
      logger.error(
        `Failed to insert token prices into database: ${error.message}`
      )
      return { success: false, error: error.message }
    }

    logger.info(
      `Successfully saved ${priceEntries.length} token prices to database`
    )

    return {
      success: true,
      count: priceEntries.length,
      timestamp: currentTimestamp,
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred"
    logger.error(`Error in fetchAndSaveTokenPrices: ${errorMessage}`)
    return {
      success: false,
      error: errorMessage,
    }
  }
}

/**
 * Fetches the latest price for a specific token symbol
 */
export async function getLatestTokenPrice(symbol: string) {
  try {
    const { data, error } = await supabase
      .from("token_prices")
      .select("symbol, price, timestamp")
      .eq("symbol", symbol.toUpperCase())
      .order("timestamp", { ascending: false })
      .limit(1)
      .single()

    if (error) {
      logger.error(
        `Failed to fetch latest token price for ${symbol}: ${error.message}`
      )
      return null
    }

    return data
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(
      `Error fetching latest token price for ${symbol}: ${errorMessage}`
    )
    return null
  }
}

/**
 * Fetches price history for a specific token symbol within a time range
 */
export async function getTokenPriceHistory(
  symbol: string,
  fromTimestamp: Date,
  toTimestamp: Date
) {
  try {
    const { data, error } = await supabase
      .from("token_prices")
      .select("symbol, price, timestamp")
      .eq("symbol", symbol.toUpperCase())
      .gte("timestamp", fromTimestamp.toISOString())
      .lte("timestamp", toTimestamp.toISOString())
      .order("timestamp", { ascending: true })

    if (error) {
      logger.error(
        `Failed to fetch token price history for ${symbol}: ${error.message}`
      )
      return []
    }

    return data || []
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    logger.error(
      `Error fetching token price history for ${symbol}: ${errorMessage}`
    )
    return []
  }
}
