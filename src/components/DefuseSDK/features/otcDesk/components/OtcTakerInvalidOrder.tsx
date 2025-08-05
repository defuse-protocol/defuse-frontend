import { ExclamationTriangleIcon } from "@radix-ui/react-icons"
import { Cross2Icon } from "@radix-ui/react-icons"
import { Callout } from "@radix-ui/themes"
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../../types/base"
import { assert } from "../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import type { TradeTerms } from "../utils/deriveTradeTerms"
import { SwapStrip } from "./shared/SwapStrip"

export function OtcTakerInvalidOrder({
  error,
  tradeTerms,
  tokenIn,
  tokenOut,
}: {
  error?: string
  tradeTerms?: TradeTerms
  tokenIn?: BaseTokenInfo | UnifiedTokenInfo
  tokenOut?: BaseTokenInfo | UnifiedTokenInfo
}) {
  let amountIn: TokenValue | undefined
  let amountOut: TokenValue | undefined
  let breakdown:
    | {
        takerSends: TokenValue
        takerReceives: TokenValue
      }
    | undefined

  if (tradeTerms != null && tokenIn != null && tokenOut != null) {
    amountIn = computeTotalBalanceDifferentDecimals(
      getUnderlyingBaseTokenInfos(tokenIn),
      tradeTerms.takerTokenDiff,
      { strict: false }
    )

    amountOut = computeTotalBalanceDifferentDecimals(
      getUnderlyingBaseTokenInfos(tokenOut),
      tradeTerms.takerTokenDiff,
      { strict: false }
    )

    assert(amountIn != null && amountOut != null)

    breakdown = {
      takerSends: negateTokenValue(amountIn),
      takerReceives: amountOut,
    }
  }

  return (
    <div>
      {/* Header Section */}
      <div className="flex flex-row justify-between mb-5">
        <div className="flex flex-col items-start gap-1.5">
          <div className="text-2xl font-black text-gray-12 mb-2">Oops!</div>
          <div className="text-sm font-medium text-gray-11">
            Looks like this trade is no longer valid — either it expired or the
            funds aren’t there.
          </div>
          <div className="text-sm font-medium text-gray-11">
            Check back with the sender for an update.
          </div>
        </div>
        <div className="flex justify-center items-start">
          <div className="w-[64px] h-[64px] flex items-center justify-center rounded-full bg-red-4">
            <Cross2Icon className="size-7 text-red-a11" />
          </div>
        </div>
      </div>

      {/* Error Section */}
      {error != null && (
        <Callout.Root size="1" color="red">
          <Callout.Icon>
            <ExclamationTriangleIcon />
          </Callout.Icon>
          <Callout.Text>{error}</Callout.Text>
        </Callout.Root>
      )}

      {/* Order Section */}
      {tradeTerms != null &&
        breakdown != null &&
        tokenIn != null &&
        tokenOut != null && (
          <SwapStrip
            tokenIn={tokenIn}
            tokenOut={tokenOut}
            amountIn={breakdown.takerSends}
            amountOut={breakdown.takerReceives}
          />
        )}
    </div>
  )
}
