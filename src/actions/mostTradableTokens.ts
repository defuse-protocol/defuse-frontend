"use server"

import { chQuery } from "@src/utils/clickhouse"
import { logger } from "@src/utils/logger"

export type MostTradableTokenEntity = {
  symbol_out: string
  blockchain_out: string
  volume: number
}

export type MostTradableTokensResponse = {
  tokens: Array<MostTradableTokenEntity>
}

const MOST_TRADABLE_TOKENS_QUERY = `
  SELECT
    symbol_out,
    blockchain_out,
    sum(intents_swaps.amount_usd_fact) as volume
  FROM near_intents_metrics.intents_swaps
  WHERE intents_swaps.block_timestamp >= now() - INTERVAL 24 HOUR 
  AND is_swap = 'yes'
  AND symbol_out NOT IN ('USDT', 'USDC', 'DAI')
  GROUP BY 
    symbol_out,
    blockchain_out
  ORDER BY volume DESC
  LIMIT 15
`

/**
 * Server action to fetch the most tradable tokens by volume in the last 24 hours.
 */
export async function getMostTradableTokens(): Promise<MostTradableTokensResponse> {
  try {
    const tokens = await chQuery<MostTradableTokenEntity>(
      MOST_TRADABLE_TOKENS_QUERY
    )

    return {
      tokens,
    }
  } catch (error) {
    logger.error(error)
    throw new Error("Failed to fetch most tradable tokens")
  }
}
