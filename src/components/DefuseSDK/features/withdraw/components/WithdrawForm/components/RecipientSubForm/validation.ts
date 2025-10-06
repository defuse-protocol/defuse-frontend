import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { Err, Ok, type Result } from "@thames/monads"
import { JsonRpcProvider } from "near-api-js/lib/providers/json-rpc-provider"
import { isAddress } from "viem"
import { settings } from "../../../../../../constants/settings"
import type { SupportedChainName } from "../../../../../../types/base"
import { validateAddress } from "../../../../../../utils/validateAddress"
import { isNearIntentsNetwork } from "../../utils"

type ValidateAddressSoftReturnType = boolean
export type ValidateAddressSoftErrorType = {
  name: "ADDRESS_INVALID" | "SELF_WITHDRAWAL"
}

export function validateAddressSoft(
  recipientAddress: string,
  chainName: SupportedChainName | "near_intents",
  userAddress?: string,
  chainType?: AuthMethod
): Result<ValidateAddressSoftReturnType, ValidateAddressSoftErrorType> {
  // Special handling for Near Intents network
  if (userAddress && isNearIntentsNetwork(chainName)) {
    if (isSelfWithdrawal(recipientAddress, userAddress, chainType)) {
      return Err({ name: "SELF_WITHDRAWAL" })
    }
    // Only validate as NEAR address for Near Intents
    if (validateAddress(recipientAddress, "near")) {
      return Ok(true)
    }
    return Err({ name: "ADDRESS_INVALID" })
  }

  // For other networks, validate using the chain's rules
  if (!isNearIntentsNetwork(chainName)) {
    const isValidChainAddress = validateAddress(
      recipientAddress,
      chainName as SupportedChainName
    )
    const isNearEVMCompatible = isNearEVMAddress(
      recipientAddress,
      chainName as SupportedChainName
    )
    if (isValidChainAddress || isNearEVMCompatible) {
      return Ok(true)
    }
  }

  return Err({ name: "ADDRESS_INVALID" })
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
  const internalUserAddress = authIdentity.authHandleToIntentsUserId(
    userAddress,
    chainType
  )
  if (internalUserAddress === recipientAddress.toLowerCase()) {
    return true
  }
  return false
}

export type ValidateNearExplicitAccountErrorType = {
  name: "ACCOUNT_DOES_NOT_EXIST" | "UNHANDLED_ERROR"
}

export async function validateNearExplicitAccount(
  recipient: string
): Promise<Result<boolean, ValidateNearExplicitAccountErrorType>> {
  try {
    // Use pure JsonRpcProvider to get proper error messages
    const provider = new JsonRpcProvider({ url: settings.rpcUrls.near })
    await provider.query({
      request_type: "view_account",
      account_id: recipient,
      finality: "final",
    })
    return Ok(true)
  } catch (error) {
    if (isNearAccountError(error)) {
      return Err({ name: "ACCOUNT_DOES_NOT_EXIST" })
    }
    return Err({ name: "UNHANDLED_ERROR" })
  }
}

const isNearAccountError = (error: unknown): error is Error => {
  return (
    error instanceof Error &&
    "type" in error &&
    typeof error.type === "string" &&
    error.type.includes("AccountDoesNotExist")
  )
}
