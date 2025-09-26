import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type { BalanceMapping } from "../features/machines/depositedBalanceMachine"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenInfo,
  TokenValue,
} from "../types/base"
import { assert, type AssertErrorType } from "./assert"
import { isLegitAccountId } from "./near"
import { isBaseToken } from "./token"

export function computeTotalBalance(
  token: BaseTokenInfo["defuseAssetId"][] | TokenInfo,
  balances: BalanceMapping
): bigint | undefined {
  // Case 1: Array of token IDs
  if (Array.isArray(token)) {
    const uniqueTokens = new Set(token)
    let total = 0n

    for (const tokenId of uniqueTokens) {
      const balance = balances[tokenId]
      if (balance == null) {
        return undefined
      }
      total += balance
    }

    return total
  }

  // Case 2: Base token
  if (isBaseToken(token)) {
    return balances[token.defuseAssetId]
  }

  // Case 3: Unified token
  return computeTotalBalance(
    token.groupedTokens.map((t) => t.defuseAssetId),
    balances
  )
}

export class DuplicateTokenError extends Error {
  constructor(tokenId: string, decimals1: number, decimals2: number) {
    super(
      `Duplicate token ${tokenId} found with different decimals: ${decimals1} and ${decimals2}`
    )
    this.name = "DuplicateTokenError"
  }
}

export function adjustDecimals(
  amount: bigint,
  fromDecimals: number,
  toDecimals: number
): bigint {
  if (fromDecimals === toDecimals) return amount
  if (fromDecimals > toDecimals) {
    return amount / BigInt(10 ** (fromDecimals - toDecimals))
  }
  return amount * BigInt(10 ** (toDecimals - fromDecimals))
}

export function deduplicateTokens(tokens: BaseTokenInfo[]): BaseTokenInfo[] {
  const tokenMap = new Map<string, BaseTokenInfo>()

  for (const token of tokens) {
    const existing = tokenMap.get(token.defuseAssetId)
    if (existing) {
      if (existing.decimals !== token.decimals) {
        throw new DuplicateTokenError(
          token.defuseAssetId,
          existing.decimals,
          token.decimals
        )
      }
      // If decimals match, keep existing token
      continue
    }
    tokenMap.set(token.defuseAssetId, token)
  }

  return Array.from(tokenMap.values())
}

/**
 * @param token - The token or array of tokens to compute the balance for.
 * @param balances - The mapping of token balances.
 * @param config - Configuration options.
 * @param config.strict - Ensures all tokens have a balance if `true`, otherwise returns `undefined`.
 */
export function computeTotalBalanceDifferentDecimals(
  token: BaseTokenInfo[] | TokenInfo,
  balances: BalanceMapping,
  config: { strict: boolean } = { strict: true }
): TokenValue | undefined {
  // Case 1: Base token
  if (!Array.isArray(token) && isBaseToken(token)) {
    // biome-ignore lint/style/noParameterAssign: This is a valid use case
    token = [token]
  }

  // Case 2: Unified token
  const uniqueTokens = deduplicateTokens(
    Array.isArray(token) ? token : token.groupedTokens
  )

  if (uniqueTokens.length === 0) {
    return { amount: 0n, decimals: 0 }
  }

  const maxDecimals = Math.max(...uniqueTokens.map((t) => t.decimals))
  let total = null

  for (const t of uniqueTokens) {
    const balance = balances[t.defuseAssetId]
    if (balance == null) {
      if (config.strict) {
        return undefined
      }
      continue
    }

    total ??= 0n
    total += adjustDecimals(balance, t.decimals, maxDecimals)
  }

  if (total == null) {
    return undefined
  }

  return { amount: total, decimals: maxDecimals }
}

export function computeTotalDeltaDifferentDecimals(
  tokens: BaseTokenInfo[],
  tokenDeltas: [string, bigint][]
): TokenValue {
  const mapping: Record<string, bigint> = {}
  for (const [token, amount] of tokenDeltas) {
    mapping[token] ??= 0n
    mapping[token] += amount
  }

  return (
    computeTotalBalanceDifferentDecimals(tokens, mapping, {
      strict: false,
    }) ?? { amount: 0n, decimals: 0 }
  )
}

/**
 * Convert a unified token to a base token, by getting the first token in the group.
 * It should be used when you need to get *ANY* single token from a unified token.
 */
export function getAnyBaseTokenInfo(token: TokenInfo): BaseTokenInfo {
  const t = getUnderlyingBaseTokenInfos(token)[0]
  assert(t != null, "Token is undefined")
  return t
}

export function getUnderlyingBaseTokenInfos(
  token: TokenInfo | BaseTokenInfo[]
): BaseTokenInfo[] {
  let tokens: BaseTokenInfo[]
  if (Array.isArray(token)) {
    tokens = token
  } else {
    tokens = isBaseToken(token) ? [token] : token.groupedTokens
  }

  return deduplicateTokens(tokens)
}

export function getDerivedToken(
  tokenIn: TokenInfo,
  chainName: string | null
): BaseTokenInfo | null {
  if (chainName == null) {
    return null
  }

  for (const token of getUnderlyingBaseTokenInfos(tokenIn)) {
    if (token.deployments.some((depl) => depl.chainName === chainName)) {
      return token
    }
  }

  return null
}

export function getTokenMaxDecimals(token: TokenInfo): number {
  const tokens = getUnderlyingBaseTokenInfos(token)
  return Math.max(...tokens.map((t) => t.decimals))
}

export function compareAmounts(
  value1: TokenValue,
  value2: TokenValue
): -1 | 0 | 1 {
  const maxDecimals = Math.max(value1.decimals, value2.decimals)
  const normalizedAmount1 = adjustDecimals(
    value1.amount,
    value1.decimals,
    maxDecimals
  )
  const normalizedAmount2 = adjustDecimals(
    value2.amount,
    value2.decimals,
    maxDecimals
  )

  if (normalizedAmount1 < normalizedAmount2) return -1
  if (normalizedAmount1 > normalizedAmount2) return 1
  return 0
}

export function minAmounts(value1: TokenValue, value2: TokenValue): TokenValue {
  return compareAmounts(value1, value2) <= 0 ? value1 : value2
}

export function addAmounts(
  ...values: [TokenValue, TokenValue, ...TokenValue[]]
): TokenValue {
  const maxDecimals = Math.max(...values.map((v) => v.decimals))

  let sum = 0n
  for (const v of values) {
    sum += adjustDecimals(v.amount, v.decimals, maxDecimals)
  }

  return {
    amount: sum,
    decimals: maxDecimals,
  }
}

/**
 * @param chainType - The chain type of the user's connected wallet.
 * @param blockchain - The target blockchain the user is bridging to.
 * Note: There is no minimum deposit or withdrawal amount for NEAR-to-NEAR bridging.
 * Effectively, it can be as low as 0.000001 USDC (i.e., negligible).
 */
export function isMinAmountNotRequired(
  chainType: AuthMethod,
  blockchain: SupportedChainName | "near_intents"
) {
  return chainType === "near" && blockchain === "near"
}

export function subtractAmounts(
  value1: TokenValue,
  token2: TokenValue
): TokenValue {
  return addAmounts(value1, {
    amount: -token2.amount,
    decimals: token2.decimals,
  })
}

export function adjustDecimalsTokenValue(
  value: TokenValue,
  toDecimals: number
): TokenValue {
  return {
    amount: adjustDecimals(value.amount, value.decimals, toDecimals),
    decimals: toDecimals,
  }
}

export function truncateTokenValue(
  value: TokenValue,
  decimals: number
): TokenValue {
  return adjustDecimalsTokenValue(
    adjustDecimalsTokenValue(value, decimals),
    value.decimals
  )
}

export function negateTokenValue(value: TokenValue): TokenValue {
  return {
    amount: -value.amount,
    decimals: value.decimals,
  }
}

/**
 * 1 bip = 0.0001% = 0.000001
 * 3000 bips = 0.3% = 0.003
 * 1000000 bips = 100% = 1
 */
export const BASIS_POINTS_DENOMINATOR = 1_000_000n

/**
 * Calculates net amount by deducting fee from gross amount.
 * @example
 * // If gross amount is 100000n with 0.3% fee, net amount is 99700n
 * netDownAmount(100000n, 3000) == 99700n
 */
export function netDownAmount(amount: bigint, feeBip: number): bigint {
  if (feeBip < 0 || feeBip > Number(BASIS_POINTS_DENOMINATOR)) {
    throw new Error(
      `Invalid feeBip value. It must be between 0 and ${BASIS_POINTS_DENOMINATOR}.`
    )
  }

  if (amount < 0n) {
    throw new Error("Amount must be non-negative.")
  }

  if (amount === 0n || feeBip === 0) return amount

  // Multiply first to maintain precision, then add BASIS_POINTS_DENOMINATOR-1 for ceiling division
  const feeAmount =
    (amount * BigInt(feeBip) + (BASIS_POINTS_DENOMINATOR - 1n)) /
    BASIS_POINTS_DENOMINATOR

  return amount - feeAmount
}

/**
 * Calculates gross amount needed to achieve desired net amount after fee.
 * @example
 * // To receive net 100000n after 0.3% fee, gross amount needed is 100300n
 * grossUpAmount(100000n, 3000) == 100300n
 */
export function grossUpAmount(amount: bigint, feeBip: number): bigint {
  if (feeBip < 0 || feeBip > Number(BASIS_POINTS_DENOMINATOR)) {
    throw new Error(
      `Invalid feeBip value. It must be between 0 and ${BASIS_POINTS_DENOMINATOR}.`
    )
  }

  if (amount < 0n) {
    throw new Error("Amount must be non-negative.")
  }

  if (amount === 0n || feeBip === 0) return amount

  const feeMultiplier = BASIS_POINTS_DENOMINATOR - BigInt(feeBip)
  // Multiply first, then add (denominator-1) for ceiling division
  const grossAmount =
    (amount * BASIS_POINTS_DENOMINATOR + (feeMultiplier - 1n)) / feeMultiplier

  return grossAmount
}

/**
 * Slippage can affect only positive numbers, because positive delta mean
 * that much will receive, and user can receive a bit less than that
 * depending on market conditions.
 */
export function accountSlippageExactIn(
  delta: [string, bigint][],
  slippageBasisPoints: number
): [string, bigint][] {
  return delta.map(([token, amount]) => {
    if (amount > 0n) {
      const amountWithSlippage = netDownAmount(amount, slippageBasisPoints)
      return [token, amountWithSlippage]
    }
    return [token, amount]
  })
}

export function filterOutPoaBridgeTokens(token: TokenInfo): string[] {
  const defuseAssetIds = getUnderlyingBaseTokenInfos(token).filter((t) =>
    t.deployments.some((d) => d.bridge === "poa")
  )

  return getTokenAccountIds(defuseAssetIds)
}

export function getTokenAccountIds(tokens: BaseTokenInfo[]): string[] {
  return tokens.map((t) => getTokenAccountId(t.defuseAssetId))
}

/**
 * Converts Defuse asset ID to token contract ID.
 * nep141:wrap.near → wrap.near
 * nep245:v2_1.omni.hot.tg:56_11111111111111111111 → v2_1.omni.hot.tg
 */
export function getTokenAccountId(assetId: string): string {
  const { contractId } = parseDefuseAssetId(assetId)
  return contractId
}

export type ParseDefuseAssetIdReturnType =
  | {
      standard: "nep141"
      contractId: string
    }
  | {
      standard: "nep245"
      contractId: string
      tokenId: string
    }

export type ParseDefuseAssetIdErrorType = AssertErrorType

/**
 * Parses Defuse asset ID into its components based on the token standard.
 * nep141:wrap.near → { standard: nep141, contractId: wrap.near }
 * nep245:v2_1.omni.hot.tg:56_11111111111111111111 -> { standard: nep245, contractId: v2_1.omni.hot.tg, tokenId: 56_11111111111111111111 }
 */
export function parseDefuseAssetId(
  assetId: string
): ParseDefuseAssetIdReturnType {
  const [tokenStandard, tokenContractId, multiTokenId] = assetId.split(":")

  assert(
    tokenContractId != null && isLegitAccountId(tokenContractId),
    "Incorrect format of assetId"
  )

  switch (tokenStandard) {
    case "nep141":
      return {
        standard: "nep141",
        contractId: tokenContractId,
      }
    case "nep245": {
      assert(multiTokenId != null, "Incorrect NEP-245 token format")
      return {
        standard: "nep245",
        contractId: tokenContractId,
        tokenId: multiTokenId,
      }
    }
    default:
      assert(false, `Unsupported token standard: ${tokenStandard}`)
  }
}

export function tokenAccountIdToDefuseAssetId(address: string): string {
  return `nep141:${address}`
}

export function* eachBaseTokenInfo(tokenList: TokenInfo[]) {
  for (const t of tokenList) {
    for (const tt of getUnderlyingBaseTokenInfos(t)) {
      yield tt
    }
  }
}
