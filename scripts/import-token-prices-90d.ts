import { supabase } from "@src/libs/supabase"
import { coinGeckoApiClient } from "@src/utils/coinGeckoApiClient"
import {
  type CoinGeckoId,
  coinGeckoIdBySymbol,
} from "@src/utils/coinGeckoTokenIds"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function importTokenPrices90d() {
  const supportedSymbols = Object.keys(coinGeckoIdBySymbol) as CoinGeckoId[]
  const days = 90
  let totalInserted = 0

  for (const symbol of supportedSymbols) {
    const coinGeckoId = coinGeckoIdBySymbol[symbol]
    console.log(`Fetching 90d history for ${symbol} (${coinGeckoId})...`)
    try {
      // Fetch 90 days of daily prices
      const data = await coinGeckoApiClient.getTokenMarketData(
        coinGeckoId,
        days
      )
      if (!data?.prices?.length) {
        console.warn(`No price data for ${symbol}`)
        continue
      }
      // Prepare entries for DB
      const priceEntries = data.prices.map(
        ([timestamp, price]: [number, number]) => ({
          symbol: symbol.toUpperCase(),
          price: Math.round(price * 100000000),
          timestamp: new Date(timestamp).toISOString(),
        })
      )
      // Filter out duplicates (already in DB)
      for (const entry of priceEntries) {
        const { data: existing, error: selectError } = await supabase
          .from("token_prices")
          .select("symbol, timestamp")
          .eq("symbol", entry.symbol)
          .eq("timestamp", entry.timestamp)
          .maybeSingle()
        if (selectError) {
          console.error(
            `Error checking existing for ${entry.symbol} at ${entry.timestamp}:`,
            selectError
          )
          continue
        }
        if (existing) continue // skip duplicate
        // Insert
        const { error: insertError } = await supabase
          .from("token_prices")
          .insert(entry)
        if (insertError) {
          console.error(
            `Error inserting ${entry.symbol} at ${entry.timestamp}:`,
            insertError
          )
        } else {
          totalInserted++
        }
      }
      console.log(`Done: ${symbol} (${coinGeckoId})`)
    } catch (err) {
      console.error(`Failed for ${symbol}:`, err)
      // Stop script if error occurs
      process.exit(1)
      return
    }

    // Sleep for 3 second between API calls to avoid rate limiting
    await sleep(3000)
  }
  console.log(`Import complete. Total new records inserted: ${totalInserted}`)
}

importTokenPrices90d()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
