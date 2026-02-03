import type { TokenValue } from "../../../types/base"

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
  // Skip invalid number formats:
  // - Single dot (.)
  // - Single minus (-)
  // - Multiple dots (1.2.3)
  // - Bad minus (1-2)
  const invalidFormAmount = !/^-?\d+(\.\d+)?$/.test(formAmount)
  if (invalidFormAmount) {
    return false
  }
  const parsedAmount = Number.parseFloat(formAmount)
  if (Number.isNaN(parsedAmount)) {
    return false
  }
  const conversionFactor = 10 ** tokenBalance.decimals
  const formAmountBigInt = BigInt(Math.round(parsedAmount * conversionFactor))
  return formAmountBigInt > tokenBalance.amount
}
