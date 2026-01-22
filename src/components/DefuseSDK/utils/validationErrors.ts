import type { ValidateRecipientAddressErrorType } from "../features/withdraw/components/WithdrawForm/components/RecipientSubForm/validationRecipientAddress"

export function renderRecipientAddressError(
  error: ValidateRecipientAddressErrorType
): string {
  switch (error) {
    case "SELF_WITHDRAWAL":
      return "You cannot withdraw to your own address. Please enter a different recipient address."
    case "ADDRESS_INVALID":
      return "Please enter a valid address for the selected blockchain."
    case "NEAR_ACCOUNT_DOES_NOT_EXIST":
      return "The account doesn't exist on NEAR. Please enter a different recipient address."
    case "USER_ADDRESS_REQUIRED":
      return "Near Intents network requires your address. Try signing in again."
    case "NEAR_RPC_UNHANDLED_ERROR":
      return "Failed to validate NEAR account. Please try again."
    default:
      return "An unexpected error occurred. Please enter a different recipient address."
  }
}
