import AssetComboIcon from "../../../../components/Asset/AssetComboIcon"
import type { TokenInfo, TokenValue } from "../../../../types/base"
import { formatTokenValue } from "../../../../utils/format"

type SwapStripProps = {
  tokenIn: TokenInfo
  tokenOut: TokenInfo
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
        {formatTokenValue(amountIn.amount, amountIn.decimals, {
          fractionDigits: 4,
        })}{" "}
        {tokenIn.symbol}
        {" → "}
        <span className="font-bold">
          {formatTokenValue(amountOut.amount, amountOut.decimals, {
            fractionDigits: 4,
          })}{" "}
          {tokenOut.symbol}
        </span>
      </div>
    </div>
  )
}
