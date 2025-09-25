import type { MultiPayload } from "@defuse-protocol/contract-types"
import type { TokenInfo } from "../../../types/base"
import { assert } from "../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  negateTokenValue,
  subtractAmounts,
} from "../../../utils/tokenUtils"
import type { TradeBreakdown } from "../types/sharedTypes"
import { deriveTradeTerms } from "./deriveTradeTerms"

export function computeTradeBreakdown(params: {
  multiPayload: MultiPayload
  tokenIn: TokenInfo
  tokenOut: TokenInfo
  protocolFee: number
}): TradeBreakdown {
  const tradeTerms = deriveTradeTerms(
    params.multiPayload,
    params.protocolFee
  ).unwrap()

  let makerSends = computeTotalBalanceDifferentDecimals(
    params.tokenIn,
    tradeTerms.makerTokenDiff,
    { strict: false }
  )
  const makerReceives = computeTotalBalanceDifferentDecimals(
    params.tokenOut,
    tradeTerms.makerTokenDiff,
    { strict: false }
  )
  assert(makerSends != null && makerReceives != null)
  makerSends = negateTokenValue(makerSends)

  const takerReceives = computeTotalBalanceDifferentDecimals(
    params.tokenIn, // tokenOut is tokenIn in the context of the taker
    tradeTerms.takerTokenDiff,
    { strict: false }
  )
  let takerSends = computeTotalBalanceDifferentDecimals(
    params.tokenOut, // tokenIn is tokenOut in the context of the taker
    tradeTerms.takerTokenDiff,
    { strict: false }
  )
  assert(takerSends != null && takerReceives != null)
  takerSends = negateTokenValue(takerSends)

  return {
    makerSends,
    makerReceives,
    makerPaysFee: subtractAmounts(makerSends, takerReceives),
    takerSends,
    takerReceives,
    takerPaysFee: subtractAmounts(takerSends, makerReceives),
  }
}
