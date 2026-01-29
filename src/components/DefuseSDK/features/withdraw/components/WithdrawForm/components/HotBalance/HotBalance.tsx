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
    <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
      <span className="size-1.5 rounded-full bg-blue-500 shrink-0" />
      Fast send: {`${adjusted.value}${adjusted.postfix}`} {symbol}
    </span>
  )
}
