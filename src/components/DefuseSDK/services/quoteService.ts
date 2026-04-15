import { getInternalQuote } from "../features/machines/1cs"
import { calculateSplitAmounts } from "../sdk/aggregatedQuote/calculateSplitAmounts"
import { AmountMismatchError } from "../sdk/aggregatedQuote/errors/amountMismatchError"
import type { BaseTokenInfo, TokenValue } from "../types/base"

type TokenSlice = BaseTokenInfo

interface BaseQuoteParams {
  waitMs: number
}

export interface AggregatedQuoteParams extends BaseQuoteParams {
  tokensIn: TokenSlice[] // set of close tokens, e.g. [USDC on Solana, USDC on Ethereum, USDC on Near]
  tokenOut: TokenSlice
  amountIn: TokenValue // total amount in
  balances: Record<string, bigint> // how many tokens of each type are available
  appFeeBps: number
}

export interface AggregatedQuote {
  quoteHashes: string[]
  /** Earliest expiration time in ISO-8601 format */
  expirationTime: string
  tokenDeltas: [string, bigint][]
  appFee: [string, bigint][]
  /** Time estimate in seconds (only available for 1cs quotes) */
  timeEstimate?: number
}

export type QuoteResult =
  | {
      tag: "ok"
      value: AggregatedQuote
    }
  | {
      tag: "err"
      value:
        | {
            reason:
              | "ERR_INSUFFICIENT_AMOUNT"
              | "ERR_NO_QUOTES"
              | "ERR_NO_QUOTES_1CS"
          }
        | {
            reason: "ERR_UNFULFILLABLE_AMOUNT"
            shortfall: TokenValue
            overage: TokenValue | null
          }
    }

export async function queryQuote(
  input: AggregatedQuoteParams
): Promise<QuoteResult> {
  let amountsToQuote: Record<string, bigint>
  try {
    amountsToQuote = calculateSplitAmounts(
      input.tokensIn,
      input.amountIn,
      input.balances
    )
  } catch (err) {
    if (err instanceof AmountMismatchError) {
      return {
        tag: "err",
        value: {
          reason: "ERR_UNFULFILLABLE_AMOUNT",
          shortfall: err.shortfall,
          overage: err.overage,
        },
      }
    }
    throw err
  }

  const entries = Object.entries(amountsToQuote)
  const results = await Promise.allSettled(
    entries.map(([tokenInAssetId, amount]) =>
      getInternalQuote({
        originAsset: tokenInAssetId,
        destinationAsset: input.tokenOut.defuseAssetId,
        amount: amount.toString(),
        quoteWaitingTimeMs: input.waitMs,
      }).then((response) => ({ tokenInAssetId, response }))
    )
  )

  const tokenDeltas: [string, bigint][] = []
  let timeEstimate: number | undefined

  for (const result of results) {
    if (result.status === "rejected") continue
    const { tokenInAssetId, response } = result.value
    tokenDeltas.push([tokenInAssetId, -BigInt(response.quote.amountIn)])
    tokenDeltas.push([
      input.tokenOut.defuseAssetId,
      BigInt(response.quote.amountOut),
    ])
    if (timeEstimate == null) {
      timeEstimate = response.quote.timeEstimate
    }
  }

  if (tokenDeltas.length === 0) {
    return { tag: "err", value: { reason: "ERR_NO_QUOTES" } }
  }

  return {
    tag: "ok",
    value: {
      quoteHashes: [],
      expirationTime: new Date(0).toISOString(), // dry run has no expiration
      tokenDeltas,
      appFee: [],
      timeEstimate,
    },
  }
}
