import Alert from "@src/components/Alert"
import type { BaseTokenInfo, TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const MinWithdrawalAmount = ({
  minWithdrawalAmount,
  tokenOut,
}: {
  minWithdrawalAmount: TokenValue
  tokenOut: BaseTokenInfo
}) => (
  <Alert variant="info" className="mt-2">
    Minimum withdrawal is ~
    {formatTokenValue(minWithdrawalAmount.amount, minWithdrawalAmount.decimals)}{" "}
    {tokenOut.symbol}
  </Alert>
)
