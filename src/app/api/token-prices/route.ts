import { supabase } from "@src/libs/supabase"
import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const querySchema = z.object({
  symbols: z
    .string()
    .transform((val) => val.split(",").map((s) => s.trim().toUpperCase())),
  days: z.coerce.number().min(1).max(365).default(7),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const queryResult = querySchema.safeParse({
      symbols: searchParams.get("symbols"),
      days: searchParams.get("days"),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: queryResult.error.errors,
        },
        { status: 400 }
      )
    }

    const { symbols, days } = queryResult.data

    if (symbols.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "At least one symbol must be provided",
        },
        { status: 400 }
      )
    }

    // Calculate the date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fetch price data from the database
    const { data, error } = await supabase
      .from("token_prices")
      .select("symbol, price, timestamp")
      .in("symbol", symbols)
      .gte("timestamp", startDate.toISOString())
      .lte("timestamp", endDate.toISOString())
      .order("timestamp", { ascending: true })

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
        },
        { status: 500 }
      )
    }

    // Group data by symbol
    const groupedData: Record<
      string,
      Array<{
        price: number
        timestamp: string
      }>
    > = {}

    for (const symbol of symbols) {
      groupedData[symbol] = []
    }

    for (const record of data || []) {
      if (groupedData[record.symbol]) {
        groupedData[record.symbol].push({
          price: record.price,
          timestamp: record.timestamp,
        })
      }
    }

    // Calculate latest prices and price changes
    const result: Record<
      string,
      {
        latestPrice: number | null
        priceChange: number | null
        priceChangePercent: number | null
        history: Array<{
          price: number
          timestamp: string
        }>
      }
    > = {}

    for (const symbol of symbols) {
      const history = groupedData[symbol]

      if (history.length === 0) {
        result[symbol] = {
          latestPrice: null,
          priceChange: null,
          priceChangePercent: null,
          history: [],
        }
        continue
      }

      // Sort by timestamp to get latest and earliest
      const sortedHistory = history.sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      )

      const latestPrice = sortedHistory[sortedHistory.length - 1].price
      const earliestPrice = sortedHistory[0].price

      // Convert back to decimal (divide by 100000000)
      const latestPriceDecimal = latestPrice / 100000000
      const earliestPriceDecimal = earliestPrice / 100000000

      const priceChange = latestPriceDecimal - earliestPriceDecimal
      const priceChangePercent =
        earliestPriceDecimal !== 0
          ? (priceChange / earliestPriceDecimal) * 100
          : 0

      result[symbol] = {
        latestPrice: latestPriceDecimal,
        priceChange,
        priceChangePercent,
        history: sortedHistory.map((record) => ({
          price: record.price / 100000000, // Convert to decimal
          timestamp: record.timestamp,
        })),
      }
    }

    return NextResponse.json({
      success: true,
      data: result,
      query: {
        symbols,
        days,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
