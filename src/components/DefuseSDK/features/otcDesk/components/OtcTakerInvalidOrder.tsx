import { ArrowLongRightIcon } from "@heroicons/react/16/solid"
import { XMarkIcon } from "@heroicons/react/20/solid"
import Alert from "@src/components/Alert"
import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import ListItem from "@src/components/ListItem"
import type { TokenInfo, TokenValue } from "../../../types/base"
import { assert } from "../../../utils/assert"
import {
  computeTotalBalanceDifferentDecimals,
  getUnderlyingBaseTokenInfos,
  negateTokenValue,
} from "../../../utils/tokenUtils"
import type { TradeTerms } from "../utils/deriveTradeTerms"

export function OtcTakerInvalidOrder({
  error,
  tradeTerms,
  tokenIn,
  tokenOut,
}: {
  error?: string
  tradeTerms?: TradeTerms
  tokenIn?: TokenInfo
  tokenOut?: TokenInfo
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
    <div className="relative rounded-3xl bg-surface-card p-6 border border-border overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-24 bg-linear-to-b from-red-50/50 to-red-50/0" />

      <div className="relative flex flex-col items-center justify-center mt-7">
        <div className="size-13 rounded-full bg-red-100 flex justify-center items-center">
          <XMarkIcon className="size-6 text-red-600" />
        </div>

        <h2 className="mt-5 text-2xl/7 font-bold tracking-tight text-center">
          This deal is no longer valid
        </h2>
        <p className="mt-2 text-base/5 font-medium text-fg-secondary text-center text-balance">
          This deal has either expired or the funds are no longer available.
          Check with deal creator for more information.
        </p>
      </div>

      {tradeTerms != null &&
        breakdown != null &&
        tokenIn != null &&
        tokenOut != null && (
          <ListItem className="mt-3">
            <div className="flex items-center">
              <AssetComboIcon {...tokenIn} />
              <AssetComboIcon
                {...tokenOut}
                className="-ml-4 ring-3 ring-white rounded-full"
              />
            </div>
            <ListItem.Content>
              <ListItem.Title className="flex items-center gap-0.5">
                {tokenIn.symbol}
                <ArrowLongRightIcon className="size-4 text-fg-tertiary shrink-0" />
                {tokenOut.symbol}
              </ListItem.Title>
            </ListItem.Content>
            <ListItem.Content align="end">
              <ListItem.Title>
                {formatTokenValue(
                  breakdown.takerReceives.amount,
                  breakdown.takerReceives.decimals,
                  {
                    fractionDigits: 5,
                  }
                )}{" "}
                {tokenOut.symbol}
              </ListItem.Title>
              <ListItem.Subtitle>
                {formatTokenValue(
                  breakdown.takerSends.amount,
                  breakdown.takerSends.decimals,
                  {
                    fractionDigits: 5,
                  }
                )}{" "}
                {tokenIn.symbol}
              </ListItem.Subtitle>
            </ListItem.Content>
          </ListItem>
        )}

      {error != null && (
        <Alert variant="error" className="mt-5">
          {error}
        </Alert>
      )}
    </div>
  )
}
