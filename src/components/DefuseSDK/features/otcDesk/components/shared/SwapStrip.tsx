import { AssetComboIcon } from "../../../../components/Asset/AssetComboIcon"
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"

type SwapStripProps = {
  tokenIn: BaseTokenInfo | UnifiedTokenInfo
  tokenOut: BaseTokenInfo | UnifiedTokenInfo
  amountIn: TokenValue
  amountOut: TokenValue
}

export function SwapStrip({
  tokenIn,
  tokenOut,
  amountIn,
  amountOut,
}: SwapStripProps) {
  return (
    <div className="flex justify-between items-center gap-2 px-4 py-3.5 rounded-lg bg-gray-3 mt-5">
      <div className="flex items-center">
        <div className="flex items-center relative">
          <AssetComboIcon {...tokenIn} />
          <div className="flex relative items-center -left-[10px] z-10">
            <AssetComboIcon {...tokenOut} />
          </div>
        </div>
        <div className="text-sm text-a12 font-bold">Swap</div>
      </div>
      <div className="text-xs text-a12">
        {formatTokenValue(
          amountIn.amount,
          amountIn.decimals,
          { fractionDigits: 4 }
          // biome-ignore lint/nursery/useConsistentCurlyBraces: <explanation>
        )}{" "}
        {tokenIn.symbol}
        {/* biome-ignore lint/nursery/useConsistentCurlyBraces: <explanation> */}
        {" → "}
        <span className="font-bold">
          {formatTokenValue(
            amountOut.amount,
            amountOut.decimals,
            { fractionDigits: 4 }
            // biome-ignore lint/nursery/useConsistentCurlyBraces: <explanation>
          )}{" "}
          {tokenOut.symbol}
        </span>
      </div>
    </div>
  )
}
