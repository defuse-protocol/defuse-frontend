import { authHandleToIntentsUserId } from "@src/components/DefuseSDK/utils/authIdentity"
import { isAddress } from "viem"
import type { AuthMethod } from "../../../../../../types"
import type { SupportedChainName } from "../../../../../../types/base"
import { validateAddress } from "../../../../../../utils/validateAddress"
import { isNearIntentsNetwork } from "../../utils"

export function validateAddressSoft(
  recipientAddress: string,
  chainName: SupportedChainName | "near_intents",
  userAddress?: string,
  chainType?: AuthMethod
): string | null {
  // Special handling for Near Intents network
  if (userAddress && isNearIntentsNetwork(chainName)) {
    if (isSelfWithdrawal(recipientAddress, userAddress, chainType)) {
      return "You cannot withdraw to your own address. Please enter a different recipient address."
    }
    // Only validate as NEAR address for Near Intents
    if (validateAddress(recipientAddress, "near")) {
      return null
    }
    return "Please enter a valid address for the selected blockchain."
  }

  // For other networks, validate using the chain's rules
  if (
    !isNearIntentsNetwork(chainName) &&
    (validateAddress(recipientAddress, chainName as SupportedChainName) ||
      isNearEVMAddress(recipientAddress, chainName as SupportedChainName))
  ) {
    return null
  }

  return "Please enter a valid address for the selected blockchain."
}

function isNearEVMAddress(
  address: string,
  chainName: SupportedChainName
): boolean {
  return chainName === "near" && isAddress(address)
}

function isSelfWithdrawal(
  recipientAddress: string,
  userAddress: string,
  chainType: AuthMethod | undefined
): boolean {
  if (!chainType) return false
  // Direct match (case-insensitive)
  if (userAddress.toLowerCase() === recipientAddress.toLowerCase()) {
    return true
  }
  // Internal user ID match (for Near Intents)
  const internalUserAddress = authHandleToIntentsUserId(userAddress, chainType)
  if (internalUserAddress === recipientAddress.toLowerCase()) {
    return true
  }
  return false
}
