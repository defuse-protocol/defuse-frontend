import type { poaBridge } from "@defuse-protocol/internal-utils"
import { settings } from "../../constants/settings"
import type { AssertionError } from "../../errors/assert"
import type { BaseTokenInfo, TokenValue } from "../../types/base"
import { assert } from "../../utils/assert"
import {
  adjustDecimals,
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
  netDownAmount,
} from "../../utils/tokenUtils"
import {
  type GetQuoteParams,
  type GetQuoteReturnType,
  getQuote,
} from "../solverRelay/getQuote"
import type { AggregatedQuote } from "../solverRelay/types/quote"
import { aggregateQuotes } from "./aggregateQuotes"
import { calculateSplitAmounts } from "./calculateSplitAmounts"
import type { AggregatedQuoteError } from "./errors/aggregatedQuoteError"
import type { AmountMismatchError } from "./errors/amountMismatchError"

type TokenSlice = BaseTokenInfo

export interface GetAggregatedExactInQuoteParams {
  tokensIn: TokenSlice[] // set of close tokens, e.g. [USDC on Solana, USDC on Ethereum, USDC on Near]
  tokenOut: TokenSlice // set of close tokens, e.g. [USDC on Solana, USDC on Ethereum, USDC on Near]
  amountIn: TokenValue // total amount in
  balances: Record<string, bigint> // how many tokens of each type are available
  waitMs: number
  appFeeBps: number
}

export type GetAggregatedQuoteExactInReturnType = AggregatedQuote & {
  appFee: [string, bigint][]
}
export type GetAggregatedQuoteExactInErrorType =
  | poaBridge.httpClient.JSONRPCErrorType
  | AggregatedQuoteError
  | AmountMismatchError
  | AssertionError

export async function getAggregatedQuoteExactIn({
  aggregatedQuoteParams,
  config = {},
}: {
  aggregatedQuoteParams: GetAggregatedExactInQuoteParams
  config?: Omit<GetQuoteParams["config"], "logBalanceSufficient">
}): Promise<GetAggregatedQuoteExactInReturnType> {
  const tokenOut = aggregatedQuoteParams.tokenOut
  const tokenIn = aggregatedQuoteParams.tokensIn[0]
  assert(tokenIn != null, "tokensIn is empty")

  const totalAvailableIn = computeTotalBalanceDifferentDecimals(
    aggregatedQuoteParams.tokensIn,
    aggregatedQuoteParams.balances
  )

  // If total available is less than requested, just quote the full amount from one token
  if (
    totalAvailableIn == null ||
    compareAmounts(totalAvailableIn, aggregatedQuoteParams.amountIn) === -1
  ) {
    const totalAmountIn: bigint = adjustDecimals(
      aggregatedQuoteParams.amountIn.amount,
      aggregatedQuoteParams.amountIn.decimals,
      tokenIn.decimals
    )
    const exactAmountIn: bigint = netDownAmount(
      totalAmountIn,
      aggregatedQuoteParams.appFeeBps * 100
    )

    const appFees: [string, bigint][] = []
    const appFee: bigint = totalAmountIn - exactAmountIn
    if (appFee > 0n) {
      appFees.push([tokenIn.defuseAssetId, appFee])
    }

    const quoteParams: GetQuoteParams["quoteParams"] = {
      defuse_asset_identifier_in: tokenIn.defuseAssetId,
      defuse_asset_identifier_out: tokenOut.defuseAssetId,
      exact_amount_in: exactAmountIn.toString(),
      min_deadline_ms: settings.quoteMinDeadlineMs,
      wait_ms: aggregatedQuoteParams.waitMs,
    }
    const q = getQuote({
      quoteParams,
      config: {
        ...config,
        logBalanceSufficient: false,
      },
    })

    return {
      ...aggregateQuotes(await Promise.allSettled([q]), [quoteParams]),
      appFee: appFees,
      isSimulation: true,
    }
  }

  const amountsToQuote = calculateSplitAmounts(
    aggregatedQuoteParams.tokensIn,
    aggregatedQuoteParams.amountIn,
    aggregatedQuoteParams.balances
  )

  const appFees: [string, bigint][] = []
  for (const [tokenIn1, totalAmountIn] of Object.entries(amountsToQuote)) {
    const amountIn = netDownAmount(
      totalAmountIn,
      aggregatedQuoteParams.appFeeBps * 100
    )
    amountsToQuote[tokenIn1] = amountIn
    const appFee = totalAmountIn - amountIn
    if (appFee > 0n) {
      appFees.push([tokenIn1, appFee])
    }
  }

  const { quotes, quoteParams } = await fetchQuotesForTokens(
    tokenOut.defuseAssetId,
    amountsToQuote,
    aggregatedQuoteParams.waitMs,
    {
      ...config,
      logBalanceSufficient: true,
    }
  )

  return {
    ...aggregateQuotes(quotes, quoteParams),
    appFee: appFees,
  }
}

async function fetchQuotesForTokens(
  tokenOut: string,
  amountsToQuote: Record<string, bigint>,
  waitMs: number,
  config: GetQuoteParams["config"]
): Promise<{
  quotes: PromiseSettledResult<GetQuoteReturnType>[]
  quoteParams: GetQuoteParams["quoteParams"][]
}> {
  const quoteParams = Object.entries(amountsToQuote).map(
    ([tokenIn, amountIn]): GetQuoteParams["quoteParams"] => {
      return {
        defuse_asset_identifier_in: tokenIn,
        defuse_asset_identifier_out: tokenOut,
        exact_amount_in: amountIn.toString(),
        min_deadline_ms: settings.quoteMinDeadlineMs,
        wait_ms: waitMs,
      }
    }
  )

  const quotes = await Promise.allSettled(
    quoteParams.map((quoteParams) => getQuote({ quoteParams, config }))
  )

  return { quotes, quoteParams }
}
