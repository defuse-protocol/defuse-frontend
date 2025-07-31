import type { FC } from "react"
import type { TokenValue } from "../../../../../../types/base"
import { adjustToScale } from "../../utils"

interface HotBalanceProps {
  symbol: string
  hotBalance?: TokenValue | null
}

export const HotBalance: FC<HotBalanceProps> = ({ symbol, hotBalance }) => {
  if (!hotBalance) {
    return null
  }

  const adjusted = adjustToScale(hotBalance)

  return (
    <div className="text-gray-11 text-xs font-medium">
      Fast withdrawal: {`${adjusted.value}${adjusted.postfix}`} {symbol}
    </div>
  )
}
