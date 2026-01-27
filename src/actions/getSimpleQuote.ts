"use server"

import { INTENTS_API_KEY, INTENTS_ENV } from "@src/utils/environment"
import { logger } from "@src/utils/logger"

const SOLVER_RELAY_URL =
  INTENTS_ENV === "production"
    ? "https://solver-relay-v2.chaindefuser.com/rpc?method=quote"
    : "https://solver-relay-stage.intents-near.org/rpc?method=quote"

interface QuoteParams {
  tokenInId: string
  tokenOutId: string
  amountIn: string
}

type QuoteResult =
  | {
      ok: true
      amountOut: string
      expirationTime: string
    }
  | {
      ok: false
      error: string
    }

export async function getSimpleQuote(
  params: QuoteParams
): Promise<QuoteResult> {
  const { tokenInId, tokenOutId, amountIn } = params

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }
    if (INTENTS_API_KEY) {
      headers.Authorization = `Bearer ${INTENTS_API_KEY}`
    }

    const response = await fetch(SOLVER_RELAY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "quote",
        id: crypto.randomUUID(),
        params: [
          {
            defuse_asset_identifier_in: tokenInId,
            defuse_asset_identifier_out: tokenOutId,
            exact_amount_in: amountIn,
            min_deadline_ms: 60000,
            wait_ms: 2000,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      return { ok: false, error: `HTTP ${response.status}` }
    }

    const data = await response.json()

    if (data.error) {
      return { ok: false, error: data.error.message ?? "Quote failed" }
    }

    const quotes = data.result
    if (!quotes || !Array.isArray(quotes) || quotes.length === 0) {
      return { ok: false, error: "No liquidity available" }
    }

    const validQuote = quotes.find(
      (q: Record<string, unknown>) => !("type" in q)
    )
    if (!validQuote) {
      const failedQuote = quotes[0]
      const errorType = failedQuote?.type ?? "NO_QUOTE"
      return { ok: false, error: `Quote failed: ${errorType}` }
    }

    return {
      ok: true,
      amountOut: validQuote.amount_out,
      expirationTime: validQuote.expiration_time,
    }
  } catch (error) {
    logger.error("getSimpleQuote error", { error })
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Quote request failed",
    }
  }
}
