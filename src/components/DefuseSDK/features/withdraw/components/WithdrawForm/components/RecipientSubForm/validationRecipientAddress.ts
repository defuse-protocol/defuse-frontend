import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import { utils } from "@defuse-protocol/internal-utils"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { logger } from "@src/utils/logger"
import { Err, Ok, type Result } from "@thames/monads"
import {
  FailoverRpcProvider,
  type Provider,
  TypedError,
} from "near-api-js/lib/providers"
import type { SupportedChainName } from "../../../../../../types/base"
import { validateAddress } from "../../../../../../utils/validateAddress"
import { isNearIntentsNetwork } from "../../utils"

export type ValidateRecipientAddressErrorType =
  | "ADDRESS_INVALID"
  | "SELF_WITHDRAWAL"
  | "USER_ADDRESS_REQUIRED"
  | ValidateNearExplicitAccountErrorType

export async function validationRecipientAddress(
  recipientAddress: string,
  chainName: SupportedChainName | "near_intents",
  userAddress?: string,
  chainType?: AuthMethod
): Promise<Result<boolean, ValidateRecipientAddressErrorType>> {
  // Case 1.: Near Intents network
  if (isNearIntentsNetwork(chainName)) {
    if (!userAddress) {
      return Err("USER_ADDRESS_REQUIRED")
    }
    if (isSelfWithdrawal(recipientAddress, userAddress, chainType)) {
      return Err("SELF_WITHDRAWAL")
    }

    const isValidNearAddress = validateAddress(recipientAddress, "near")

    // Validate explicit account for NEAR network
    if (isValidNearAddress && !utils.isImplicitAccount(recipientAddress)) {
      const explicitAccountExist =
        await validateAndCacheNearExplicitAccount(recipientAddress)
      if (explicitAccountExist.isErr()) {
        return Err(explicitAccountExist.unwrapErr())
      }
    }

    if (isValidNearAddress) {
      return Ok(true)
    }
    return Err("ADDRESS_INVALID")
  }

  // Case 2.: Other networks
  if (!isNearIntentsNetwork(chainName)) {
    const isValidChainAddress = validateAddress(
      recipientAddress,
      chainName as SupportedChainName
    )

    // Validate explicit account for NEAR network
    if (
      isValidChainAddress &&
      chainName === "near" &&
      !utils.isImplicitAccount(recipientAddress)
    ) {
      const explicitAccountExist =
        await validateAndCacheNearExplicitAccount(recipientAddress)
      if (explicitAccountExist.isErr()) {
        return Err(explicitAccountExist.unwrapErr())
      }
    }
    if (isValidChainAddress) {
      return Ok(true)
    }
  }

  return Err("ADDRESS_INVALID")
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

type ValidateNearExplicitAccountErrorType =
  | "NEAR_ACCOUNT_DOES_NOT_EXIST"
  | "NEAR_RPC_UNHANDLED_ERROR"

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

async function validateAndCacheNearExplicitAccount(
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

  const result = await checkNearAccountExists(recipient)
  validationCache.set(cacheKey, { result, timestamp: now })
  return result
}

async function checkNearAccountExists(
  recipient: string
): Promise<Result<boolean, ValidateNearExplicitAccountErrorType>> {
  try {
    const client = unwrapProvider(nearClient)
    await client.query({
      request_type: "view_account",
      account_id: recipient,
      finality: "final",
    })
    return Ok(true)
  } catch (error: unknown) {
    logger.warn("Failed to view NEAR account", { cause: error, recipient })

    if (typeof error === "object" && error !== null) {
      if (error instanceof TypedError && error.type === "AccountDoesNotExist") {
        return Err("NEAR_ACCOUNT_DOES_NOT_EXIST")
      }
    }

    return Err("NEAR_RPC_UNHANDLED_ERROR")
  }
}

function unwrapProvider(provider: Provider): Provider {
  if (
    provider instanceof FailoverRpcProvider &&
    provider.providers.length > 0
  ) {
    return provider.providers[0]
  }
  return provider
}
