import Alert from "@src/components/Alert"
import type { BaseTokenInfo, TokenValue } from "../../../../../../types/base"
import { formatTokenValue } from "../../../../../../utils/format"

export const MinWithdrawalAmount = ({
  minWithdrawalAmount,
  tokenOut,
  onClickAmount,
}: {
  minWithdrawalAmount: TokenValue
  tokenOut: BaseTokenInfo
  onClickAmount?: () => void
}) => {
  const formattedAmount = formatTokenValue(
    minWithdrawalAmount.amount,
    minWithdrawalAmount.decimals
  )

  return (
    <Alert variant="info" className="mt-2">
      Minimum withdrawal is ~
      {onClickAmount ? (
        <button type="button" onClick={onClickAmount} className="underline">
          {formattedAmount} {tokenOut.symbol}
        </button>
      ) : (
        <>
          {formattedAmount} {tokenOut.symbol}
        </>
      )}
    </Alert>
  )
}
