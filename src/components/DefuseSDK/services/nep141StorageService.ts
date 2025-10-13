import {
  getNearNep141MinStorageBalance,
  getNearNep141StorageBalance,
} from "@defuse-protocol/internal-utils"
import { logger } from "@src/utils/logger"
import { nearClient } from "../constants/nearClient"
import type { TokenDeployment } from "../types/base"
import { isFungibleToken } from "../utils/token"

export type Output =
  | {
      tag: "ok"
      value: bigint
    }
  | {
      tag: "err"
      value: { reason: "ERR_NEP141_STORAGE_CANNOT_FETCH" }
    }

/**
 * Get the amount of NEP-141 storage required for the user to store the token.
 * @param token The token to check.
 * @param userAccountId The user's NEAR account ID.
 * @returns The amount of NEAR required for the user to store the token; 0 means no storage required.
 */
export async function getNEP141StorageRequired({
  token,
  userAccountId,
}: {
  token: TokenDeployment
  userAccountId: string
}): Promise<Output> {
  if (!isFungibleToken(token) || token.chainName !== "near") {
    return { tag: "ok", value: 0n }
  }

  // No storage deposit is required for having ETH in near blockchain. (P.S. aurora is ETH address on Near network)
  if (token.address === "aurora") {
    return { tag: "ok", value: 0n }
  }

  const [minStorageBalanceResult, userStorageBalanceResult] =
    await Promise.allSettled([
      getNearNep141MinStorageBalance({
        contractId: token.address,
        nearProvider: nearClient,
      }),
      getNearNep141StorageBalance({
        contractId: token.address,
        accountId: userAccountId,
        nearProvider: nearClient,
      }),
    ])

  if (minStorageBalanceResult.status === "rejected") {
    logger.error(minStorageBalanceResult.reason)
    return {
      tag: "err",
      value: { reason: "ERR_NEP141_STORAGE_CANNOT_FETCH" },
    }
  }

  if (userStorageBalanceResult.status === "rejected") {
    logger.error(userStorageBalanceResult.reason)
    return {
      tag: "err",
      value: { reason: "ERR_NEP141_STORAGE_CANNOT_FETCH" },
    }
  }

  const minStorageBalance = minStorageBalanceResult.value
  const userStorageBalance = userStorageBalanceResult.value

  if (userStorageBalance < minStorageBalance) {
    return {
      tag: "ok",
      value: minStorageBalance - userStorageBalance,
    }
  }

  return {
    tag: "ok",
    value: 0n,
  }
}
