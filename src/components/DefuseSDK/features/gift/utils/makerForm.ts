import type { TokenValue } from "../../../types/base"
import { parseUnits } from "../../../utils/parse"

export function getButtonText(
  balanceInsufficient: boolean,
  editing: boolean,
  processing: boolean,
  amountEmpty: boolean
) {
  if (amountEmpty) {
    return "Please enter an amount"
  }
  if (balanceInsufficient) {
    return "Insufficient balance"
  }
  if (processing) {
    return "Processing..."
  }
  if (editing) {
    return "Create gift link"
  }
  return "Confirm transaction in your wallet..."
}

export function checkInsufficientBalance(
  formAmount: string,
  tokenBalance: TokenValue
): boolean {
  if (formAmount.length === 0) {
    return false
  }
  try {
    const formAmountBigInt = parseUnits(formAmount, tokenBalance.decimals)
    return formAmountBigInt > tokenBalance.amount
  } catch {
    return false
  }
}
