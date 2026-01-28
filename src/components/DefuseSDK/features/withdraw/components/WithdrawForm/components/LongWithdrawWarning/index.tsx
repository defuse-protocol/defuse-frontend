import Alert from "@src/components/Alert"
import { formatUnits } from "viem"
import type { TokenValue } from "../../../../../../types/base"
import { adjustToScale } from "../../utils"

export const LongWithdrawWarning = ({
  amountIn,
  symbol,
  hotBalance,
}: {
  amountIn: TokenValue | null
  symbol: string
  hotBalance?: TokenValue | null
}) => {
  if (amountIn === null) {
    return null
  }
  if (!hotBalance) return null

  const shouldShow =
    Number(formatUnits(amountIn.amount, amountIn.decimals)) >=
    Number(formatUnits(hotBalance.amount, hotBalance.decimals))

  if (!shouldShow) return null

  const adjusted = adjustToScale(hotBalance)
  return (
    <Alert variant="info">
      {`${adjusted.value}${adjusted.postfix}`} {symbol} is available for instant
      send on selected network. Sending more than or close to this amount may be
      delayed while we process them, or you can choose to split the amount
      across multiple networks for faster access.
    </Alert>
  )
}
