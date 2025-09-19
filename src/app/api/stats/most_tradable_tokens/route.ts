import { chQuery } from "@src/utils/clickhouse"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"

interface MostTradableToken {
  symbol_out: string
  blockchain_out: string
  volume: number
}

interface MostTradableTokensResponse {
  tokens: MostTradableToken[]
}

const MOST_TRADABLE_TOKENS_QUERY = `
  SELECT
    symbol_out,
    blockchain_out,
    sum(intents_swaps.amount_usd_fact) as volume
  FROM near_intents_metrics.intents_swaps
  WHERE intents_swaps.block_timestamp >= now() - INTERVAL 24 HOUR 
  AND is_swap = 'yes'
  GROUP BY 
    symbol_out,
    blockchain_out
  ORDER BY volume DESC
  LIMIT 10
`

/**
 * Fetches the most tradable tokens by volume in the last 24 hours.
 */
export async function GET() {
  try {
    const tokens = await chQuery<MostTradableToken>(MOST_TRADABLE_TOKENS_QUERY)

    return NextResponse.json({
      tokens,
    } satisfies MostTradableTokensResponse)
  } catch (error) {
    logger.error(error)
    return NextResponse.error()
  }
}
