import type { TokenValue } from "../../../types/base"
import {
  adjustDecimals,
  grossUpAmount,
  netDownAmount,
} from "../../../utils/tokenUtils"

export interface TokenBalances {
  [token: string]: bigint
}

export interface TokenValues {
  [token: string]: TokenValue
}

interface FillStep {
  fromToken: string
  toToken: string
  fromAmount: bigint
  toAmount: bigint
  fee: bigint
}

export interface FillResult {
  remainingBalances: TokenValues
  steps: FillStep[]
  success: boolean
}

// Find best sources combining multiple tokens if necessary
function findOptimalTokenSources(
  remainingBalances: TokenValues,
  requiredAmount: bigint,
  targetToken: string,
  feeBasisPoints: bigint
): { steps: FillStep[]; success: boolean } {
  // Try to find a single token first
  const targetTokenDecimals = (remainingBalances[targetToken] as TokenValue)
    .decimals

  for (const [token, balanceData] of Object.entries(remainingBalances)) {
    if (token === targetToken) {
      continue
    }

    const { amount: balance, decimals: tokenDecimals } = balanceData

    if (balance <= 0n) {
      continue
    }

    const sourceAmount = grossUpAmount(requiredAmount, Number(feeBasisPoints))
    const adjustedBalance = adjustDecimals(
      balance,
      tokenDecimals,
      targetTokenDecimals
    )

    if (adjustedBalance >= sourceAmount) {
      // We found a single token with sufficient balance
      const adjustedFromAmount = adjustDecimals(
        sourceAmount,
        targetTokenDecimals,
        tokenDecimals
      )
      const adjustedToAmount = adjustDecimals(
        requiredAmount,
        targetTokenDecimals,
        tokenDecimals
      )

      return {
        steps: [
          {
            fromToken: token,
            toToken: targetToken,
            fromAmount: adjustedFromAmount,
            toAmount: requiredAmount,
            fee: adjustedFromAmount - adjustedToAmount,
          },
        ],
        success: true,
      }
    }
  }

  // If no single token is sufficient, try combining tokens
  // Sort tokens by decimals (ascending) to use smaller decimals first
  // if equal then sort by amount (descending)
  const sortedTokens = Object.entries(remainingBalances)
    .filter(([token]) => token !== targetToken)
    .sort(([, a], [, b]) => {
      if (b.decimals > a.decimals) {
        return -1
      }
      if (b.decimals < a.decimals) {
        return 1
      }

      // if decimals are equal then, sort by amount (descending)
      return b.amount > a.amount ? 1 : b.amount < a.amount ? -1 : 0
    })

  if (sortedTokens.length === 0) {
    return { steps: [], success: false }
  }

  const steps: FillStep[] = []
  let totalReceived = 0n

  // Try using tokens one by one until we reach the required amount
  for (const [token, balanceData] of sortedTokens) {
    const { amount: balance, decimals: tokenDecimals } = balanceData

    if (totalReceived >= requiredAmount) {
      break
    }

    if (balance <= 0n) {
      continue
    }

    const adjustedBalance = adjustDecimals(
      balance,
      tokenDecimals,
      targetTokenDecimals
    )
    const stillNeeded = requiredAmount - totalReceived

    const adjustedSourceAmount = grossUpAmount(
      stillNeeded,
      Number(feeBasisPoints)
    )

    const adjustedAmountToUse = adjustDecimals(
      adjustedSourceAmount <= adjustedBalance
        ? adjustedSourceAmount
        : adjustedBalance,
      targetTokenDecimals,
      tokenDecimals
    )

    if (adjustedAmountToUse <= 0n) {
      continue
    }

    const adjustedReceived = netDownAmount(
      adjustedAmountToUse,
      Number(feeBasisPoints)
    )

    steps.push({
      fromToken: token,
      toToken: targetToken,
      fromAmount: adjustedAmountToUse,
      toAmount: adjustDecimals(
        adjustedReceived,
        tokenDecimals,
        targetTokenDecimals
      ),
      fee: adjustedAmountToUse - adjustedReceived,
    })

    totalReceived += adjustDecimals(
      adjustedReceived,
      tokenDecimals,
      targetTokenDecimals
    )
  }

  if (totalReceived < requiredAmount) {
    return { steps: [], success: false }
  }

  return { steps, success: true }
}

export function fillWithMinimalExchanges(
  balancesWithTokenInfo: TokenValues,
  required: TokenBalances,
  feeBasisPoints: bigint
): FillResult {
  const result: FillResult = {
    remainingBalances: structuredClone(balancesWithTokenInfo),
    steps: [],
    success: true,
  }

  // Sort required tokens by amount descending to handle larger amounts first
  const sortedRequired = Object.entries(required).sort(([, a], [, b]) =>
    b > a ? 1 : b < a ? -1 : 0
  )

  // First pass: Use direct balances where possible
  for (const [token, requiredAmount] of sortedRequired) {
    const tokenBalanceData = result.remainingBalances[token] as TokenValue
    if (!tokenBalanceData) {
      continue
    }

    const availableAmount = tokenBalanceData.amount ?? 0n

    if (availableAmount >= requiredAmount) {
      // We have enough of this token directly
      tokenBalanceData.amount = availableAmount - requiredAmount
      result.steps.push({
        fromToken: token,
        toToken: token,
        fromAmount: requiredAmount,
        toAmount: requiredAmount,
        fee: 0n,
      })
      continue
    }

    // Handle case where we have some of the required token but not enough
    const remainingRequired = requiredAmount - availableAmount

    // Use whatever amount of the token we do have
    if (availableAmount > 0n) {
      result.steps.push({
        fromToken: token,
        toToken: token,
        fromAmount: availableAmount,
        toAmount: availableAmount,
        fee: 0n,
      })
      tokenBalanceData.amount = 0n
    }

    // Find best sources for the remaining required amount
    const sourceResult = findOptimalTokenSources(
      result.remainingBalances,
      remainingRequired,
      token,
      feeBasisPoints
    )

    if (!sourceResult.success) {
      result.success = false
      break
    }

    // Apply all the steps from the source result
    for (const step of sourceResult.steps) {
      const tokenBalanceData = result.remainingBalances[
        step.fromToken
      ] as TokenValue
      tokenBalanceData.amount -= step.fromAmount
      result.steps.push(step)
    }
  }

  if (result.steps.length <= 0 && Object.keys(required).length > 0) {
    // any required was sent, but we end up without steps: success must be false
    result.success = false
  }

  return result
}
