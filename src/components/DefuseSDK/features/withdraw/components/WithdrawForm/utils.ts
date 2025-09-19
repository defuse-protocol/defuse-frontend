import { assert, AuthMethod } from "@defuse-protocol/internal-utils"
import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { reverseAssetNetworkAdapter } from "@src/components/DefuseSDK/utils/adapters"
import {
  getChainFromDid,
  resolveTokenByDid,
} from "@src/components/DefuseSDK/utils/tokenDeployment"
import { resolveTokenFamily } from "@src/components/DefuseSDK/utils/tokenFamily"
import { LIST_TOKENS_FLATTEN, tokenFamilies } from "@src/constants/tokens"
import { logger } from "@src/utils/logger"
import { formatUnits } from "viem"
import {
  type BlockchainOption,
  getBlockchainsOptions,
} from "../../../../constants/blockchains"
import type { TokenBalances as TokenBalancesRecord } from "../../../../services/defuseBalanceService"
import type {
  BaseTokenInfo,
  SupportedChainName,
  TokenValue,
} from "../../../../types/base"
import { isBaseToken } from "../../../../utils/token"
import { compareAmounts, minAmounts } from "../../../../utils/tokenUtils"
import type { BalanceMapping } from "../../../machines/depositedBalanceMachine"

export function chainTypeSatisfiesChainName(
  chainType: AuthMethod | undefined,
  chainName: SupportedChainName
) {
  if (chainType == null) return false

  switch (true) {
    case chainType === AuthMethod.Near && chainName === "near":
    case chainType === AuthMethod.EVM && chainName === "near":
    case chainType === AuthMethod.EVM && chainName === "eth":
    case chainType === AuthMethod.EVM && chainName === "arbitrum":
    case chainType === AuthMethod.EVM && chainName === "base":
    case chainType === AuthMethod.EVM && chainName === "turbochain":
    case chainType === AuthMethod.EVM && chainName === "tuxappchain":
    case chainType === AuthMethod.EVM && chainName === "vertex":
    case chainType === AuthMethod.EVM && chainName === "optima":
    case chainType === AuthMethod.EVM && chainName === "easychain":
    case chainType === AuthMethod.EVM && chainName === "aurora":
    case chainType === AuthMethod.EVM && chainName === "aurora_devnet":
    case chainType === AuthMethod.EVM && chainName === "gnosis":
    case chainType === AuthMethod.EVM && chainName === "berachain":
    case chainType === AuthMethod.EVM && chainName === "polygon":
    case chainType === AuthMethod.EVM && chainName === "bsc":
    case chainType === AuthMethod.EVM && chainName === "optimism":
    case chainType === AuthMethod.EVM && chainName === "avalanche":
    case chainType === AuthMethod.Solana && chainName === "solana":
    case chainType === AuthMethod.Stellar && chainName === "stellar":
    case chainType === AuthMethod.Ton && chainName === "ton":
    case chainType === AuthMethod.Tron && chainName === "tron":
      return true
  }

  return false
}

export function truncateUserAddress(hash: string) {
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

/**
 * Converts a token amount to a human-readable number and scales it relative to a reference value (default: 1,000).
 *
 * This function is useful for formatting token values in a UI where large numbers
 * should be compacted (e.g., into 'k' units for thousands).
 *
 */
export const adjustToScale = (
  tokenValue: TokenValue,
  scaleTo = 1000
): {
  value: number
  postfix: string
} => {
  if (tokenValue.amount === 0n) {
    return {
      value: 0,
      postfix: "",
    }
  }

  const normalizedValue = Number(
    formatUnits(tokenValue.amount, tokenValue.decimals)
  )

  if (normalizedValue < scaleTo) {
    return {
      value: Math.round(normalizedValue),
      postfix: "",
    }
  }

  return {
    value: Math.round(normalizedValue / scaleTo),
    postfix: "k",
  }
}

export const getAvailableBlockchains = (token: TokenInfo) => {
  return isBaseToken(token)
    ? {
        [token.chainName]: {
          defuseAssetId: token.defuseAssetId,
          bridge: token.bridge,
        },
      }
    : token.groupedTokens.reduce(
        (
          acc: {
            [key: string]: {
              defuseAssetId: string
              bridge: string
            }
          },
          curr
        ) => {
          // as if already set, means higher order defuseAssetId as higher priority
          if (acc[curr.chainName]) {
            return acc
          }
          acc[curr.chainName] = {
            defuseAssetId: curr.defuseAssetId,
            bridge: curr.bridge,
          }
          return acc
        },
        {}
      )
}

export const getMinAmountToken = (
  token1: TokenValue | undefined,
  token2: TokenValue | undefined
): TokenValue | undefined => {
  if (
    (token1 == null || token1.amount === 0n) &&
    (token2 == null || token2.amount === 0n)
  ) {
    return undefined
  }
  if (token1 == null || token1.amount === 0n) {
    return token2
  }
  if (token2 == null || token2.amount === 0n) {
    return token1
  }
  // we consider equal decimals
  return BigInt(token1?.amount || 0n) > BigInt(token2?.amount || 0n)
    ? token2
    : token1
}

export function getBlockchainSelectItems(
  token: TokenInfo,
  maxPossibleBalances: Record<string, TokenValue>
): {
  [K in SupportedChainName]?: BlockchainOption & {
    hotBalance: TokenValue | null
  }
} {
  const tf = resolveTokenFamily(tokenFamilies, token)

  const allBlockchains = Object.values(getBlockchainsOptions())
  const availableBlockchains = getAvailableBlockchains(token)

  return Object.fromEntries(
    allBlockchains
      .filter((blockchain) => {
        const parsedBlockchain = reverseAssetNetworkAdapter[blockchain.value]

        if (tf != null) {
          return tf.deployments.some(
            (d) => parsedBlockchain === getChainFromDid(d)
          )
        }

        return !!availableBlockchains[parsedBlockchain]
      })
      .map(
        (
          blockchain
        ): [
          SupportedChainName,
          BlockchainOption & { hotBalance: TokenValue | null },
        ] => {
          const parsedBlockchain = reverseAssetNetworkAdapter[blockchain.value]

          let defuseAssetId: string | null = null
          if (tf != null) {
            const tokenDid = tf.deployments.find(
              (d) => getChainFromDid(d) === parsedBlockchain
            )
            assert(tokenDid != null, "No token deployment on given blockchain")
            // todo: pass token list as a parameter
            const token = resolveTokenByDid(LIST_TOKENS_FLATTEN, tokenDid)
            if (token == null) {
              logger.warn("No token found for deployment", {
                data: { tokenDid },
              })
            } else {
              defuseAssetId = token.defuseAssetId
            }
          } else {
            const addressData = availableBlockchains[parsedBlockchain]
            assert(addressData != null)
            defuseAssetId = addressData.defuseAssetId
          }

          let hotBalance: TokenValue | null = null
          const balance =
            defuseAssetId != null
              ? maxPossibleBalances[defuseAssetId]
              : undefined

          if (balance != null) {
            hotBalance = {
              amount: balance.amount,
              decimals: balance.decimals,
            }
          }

          return [parsedBlockchain, { ...blockchain, hotBalance }]
        }
      )
  )
}

export const mapDepositBalancesToDecimals = (
  balances: TokenBalancesRecord | undefined,
  token: TokenInfo
): Record<BaseTokenInfo["defuseAssetId"], TokenValue> => {
  const tokenValueWithPrice: Record<
    BaseTokenInfo["defuseAssetId"],
    TokenValue
  > = {}

  if (balances == null) {
    return tokenValueWithPrice
  }

  const isBaseT = isBaseToken(token)
  for (const address in balances) {
    const amount = balances[address]
    if (amount == null) {
      continue
    }

    if (isBaseT) {
      if (token.defuseAssetId === address) {
        tokenValueWithPrice[address] = { amount, decimals: token.decimals }
      }
    } else {
      const found = token.groupedTokens.find(
        (token) => token.defuseAssetId === address
      )
      if (found) {
        tokenValueWithPrice[address] = { amount, decimals: found.decimals }
      }
    }
  }

  return tokenValueWithPrice
}

export const getWithdrawButtonText = (
  noLiquidity: boolean,
  insufficientTokenInAmount: boolean
) => {
  if (noLiquidity) return "No liquidity providers"
  if (insufficientTokenInAmount) return "Insufficient amount"
  return "Withdraw"
}

/**
 * Removes duplicate tokens based on both `chainName` and `defuseAssetId`.
 *
 * Duplicate detection is done by checking if the combination of
 * chain name and defuseAssetId has already been encountered.
 */
export const cleanUpDuplicateTokens = (token: TokenInfo): BaseTokenInfo[] => {
  const tokens = isBaseToken(token) ? [token] : token.groupedTokens

  const seenChains = new Set<string>()
  const seenAssetIds = new Set<string>()

  const uniqueTokens: BaseTokenInfo[] = []

  for (const t of tokens) {
    const alreadySeen =
      seenChains.has(t.chainName) || seenAssetIds.has(t.defuseAssetId)

    if (alreadySeen) continue

    seenChains.add(t.chainName)
    seenAssetIds.add(t.defuseAssetId)
    uniqueTokens.push(t)
  }

  return uniqueTokens
}

/**
 * Maps a list of tokens to their user balances, filtered by available balance data.
 *
 * Each token is identified by its `defuseAssetId`. If the balance for a token
 * is not present in `balancesData`, it will be excluded from the result.
 */
export const prepareAddressToUserBalance = (
  cleanedTokens: BaseTokenInfo[],
  balancesData: BalanceMapping
): Record<string, TokenValue> => {
  return cleanedTokens.reduce((acc: Record<string, TokenValue>, token) => {
    const { defuseAssetId } = token
    const balance = balancesData[defuseAssetId]
    if (balance == null) {
      return acc
    }

    acc[defuseAssetId] = {
      amount: balance,
      decimals: token.decimals,
    }
    return acc
  }, {})
}

function getPossibleMinimums(possibleMins: TokenValue[]): bigint {
  if (possibleMins.length > 1) {
    let minToken = minAmounts(
      possibleMins[0] as TokenValue,
      possibleMins[1] as TokenValue
    )

    if (possibleMins.length > 2) {
      minToken = minAmounts(minToken, possibleMins[2] as TokenValue)
    }

    return minToken.amount
  }

  return 0n
}

/**
 * Computes the maximum amount of tokens that can be fast-withdrawn for each unique token
 * in the swappable group, based on:
 * - user's token balances,
 * - available bridge liquidity,
 * - POA balances.
 *
 * If the available fast withdrawal amount exceeds the user's own balance for at least one token,
 * the function returns a full map of withdrawable amounts. Otherwise, it returns an empty object.
 *
 */
export const getFastWithdrawals = (
  token: TokenInfo,
  balancesData: BalanceMapping,
  poaBridgeBalances: Record<string, TokenValue>,
  liquidityData?: Record<string, bigint> | null
): Record<string, TokenValue> => {
  const maxWithdrawals: Record<string, TokenValue> = {}
  let shouldShowHotBalance = false
  const cleanedTokens = cleanUpDuplicateTokens(token)
  const addressToUserBalance = prepareAddressToUserBalance(
    cleanedTokens,
    balancesData
  )

  for (const tokenTo of cleanedTokens) {
    const { defuseAssetId: defuseAssetIdTo, decimals: decimalsTo } = tokenTo
    let min = 0n

    for (const tokenFrom of cleanedTokens) {
      const { defuseAssetId: defuseAssetIdFrom, decimals: decimalsFrom } =
        tokenFrom

      const onUserAmount = {
        amount: addressToUserBalance[defuseAssetIdFrom]?.amount ?? 0n,
        decimals: decimalsFrom,
      }

      const liquidity =
        liquidityData?.[`${defuseAssetIdFrom}#${defuseAssetIdTo}`]
      const canSwapAmount =
        defuseAssetIdFrom === defuseAssetIdTo
          ? onUserAmount.amount
          : liquidity == null
            ? undefined
            : liquidity
      const canSwap = {
        amount: canSwapAmount,
        decimals: decimalsTo,
      }

      const poaAmount = poaBridgeBalances[defuseAssetIdFrom]?.amount
      const onPoa = {
        amount: poaAmount == null ? undefined : poaAmount,
        decimals: decimalsFrom,
      }

      const possibleMins: TokenValue[] = [onUserAmount, canSwap, onPoa].filter(
        (tokenValue) => typeof tokenValue.amount === "bigint"
      ) as TokenValue[]

      min += getPossibleMinimums(possibleMins)
    }

    const maxPossibleOnDefuseAssetIdTo = {
      amount: min,
      decimals: decimalsTo,
    }

    maxWithdrawals[defuseAssetIdTo] = maxPossibleOnDefuseAssetIdTo

    const onUserBalanceTo = addressToUserBalance[defuseAssetIdTo]
    if (onUserBalanceTo != null) {
      if (
        compareAmounts(maxPossibleOnDefuseAssetIdTo, onUserBalanceTo) === -1
      ) {
        shouldShowHotBalance = true
      }
    }
  }

  return shouldShowHotBalance ? maxWithdrawals : {}
}

export function isNearIntentsNetwork(
  blockchain: SupportedChainName | "near_intents"
): boolean {
  return blockchain === "near_intents"
}
