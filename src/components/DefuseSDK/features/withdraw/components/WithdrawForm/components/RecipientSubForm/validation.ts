import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"
import * as v from "valibot"
import { isAddress } from "viem"
import { nearClient } from "../../../../../../constants/nearClient"
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

// Cache for validation results to prevent RPC spam
const validationCache = new Map<
  string,
  {
    result: Result<boolean, ValidateNearExplicitAccountErrorType>
    timestamp: number
  }
>()
const CACHE_TTL = 60000 // 1 minute TTL

function cleanupExpiredCache() {
  const now = Date.now()
  for (const [key, value] of validationCache.entries()) {
    if (now - value.timestamp >= CACHE_TTL) {
      validationCache.delete(key)
    }
  }
}

export async function validateNearExplicitAccount(
  recipient: string
): Promise<Result<boolean, ValidateNearExplicitAccountErrorType>> {
  const now = Date.now()
  const cacheKey = recipient.toLowerCase()

  // Clean up expired entries periodically (approximately every 10th call)
  if (validationCache.size > 0 && Math.random() < 0.1) {
    cleanupExpiredCache()
  }

  const cached = validationCache.get(cacheKey)
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.result
  }

  try {
    const response = await nearClient.query({
      request_type: "view_access_key_list",
      account_id: recipient,
      finality: "final",
    })
    const parsed = v.parse(v.object({ keys: v.array(v.any()) }), response)

    // Exist account should have at least one access key
    if (!parsed.keys.length) {
      const result = Err<boolean, ValidateNearExplicitAccountErrorType>({
        name: "ACCOUNT_DOES_NOT_EXIST",
      })
      validationCache.set(cacheKey, { result, timestamp: now })
      return result
    }

    const result = Ok(true)
    validationCache.set(cacheKey, { result, timestamp: now })
    return result
  } catch (error) {
    logger.warn("Failed to view NEAR account", { cause: error })
    const result = Err<boolean, ValidateNearExplicitAccountErrorType>({
      name: "UNHANDLED_ERROR",
    })
    validationCache.set(cacheKey, { result, timestamp: now })
    return result
  }
}
