import { logger } from "@src/utils/logger"
import { nearAccount } from "@src/utils/near"

// See source here - https://github.com/near/nearcore/blob/master/core/parameters/res/runtime_configs/parameters.yaml#L28
const STORAGE_COST_PER_BYTE = "10000000000000000000" // Equal to 0.00001
const MIN_RESERVE_NEAR = "100000000000000000000000" // Equal to 0.1 NEAR

export const minimumNearBalance = (storageUsed: number): bigint => {
  const storageUsedBigNumber = BigInt(storageUsed)
  const storageCostPerByteBigNumber = BigInt(STORAGE_COST_PER_BYTE)
  const calculatedStorageCost =
    storageUsedBigNumber * storageCostPerByteBigNumber
  const minReserve = BigInt(MIN_RESERVE_NEAR)

  return calculatedStorageCost > minReserve ? calculatedStorageCost : minReserve
}

export const getBalanceNearAllowedToSwap = async (
  accountId: string
): Promise<string> => {
  try {
    const viewAccount = await nearAccount(accountId)
    if (!viewAccount) {
      return "0"
    }

    const bigNumberBalance = BigInt(viewAccount.amount)
    const bigNumberMinReservedBalance = minimumNearBalance(
      viewAccount.storage_usage
    )
    const balanceAllowedToSwap = bigNumberBalance - bigNumberMinReservedBalance
    if (bigNumberMinReservedBalance > bigNumberBalance) {
      return "0"
    }

    return balanceAllowedToSwap > BigInt(0)
      ? balanceAllowedToSwap.toString()
      : "0"
  } catch (e) {
    logger.error(e)
    return "0"
  }
}
