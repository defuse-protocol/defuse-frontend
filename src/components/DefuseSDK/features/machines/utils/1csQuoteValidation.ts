import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { adjustDecimals } from "@src/components/DefuseSDK/utils/tokenUtils"
import { logger } from "@src/utils/logger"

type WithdrawQuoteResult =
  | {
      ok: {
        quote: {
          amountIn: string
          amountOut: string
          depositAddress?: string
        }
      }
    }
  | {
      err: string
    }
  | null

type ValidationInput = {
  quote1csResult: WithdrawQuoteResult
  swapType: QuoteRequest.swapType
  requestedAmountIn: bigint
  inputAmountDecimals: number
  outputAmountDecimals: number
  minAmountOut?: bigint
}

type WorseComparisonInput = ValidationInput & {
  previousOppositeAmount: bigint
}

export function parseQuoteAmount(amount: string): bigint | null {
  try {
    return BigInt(amount)
  } catch (error) {
    logger.error("Failed to parse quote amount as BigInt", {
      amount,
      error,
    })
    return null
  }
}

export function isValidWithdrawQuote(input: ValidationInput): boolean {
  const validated = validateWithdrawQuote(input)
  return validated != null
}

export function isWorseWithdrawQuoteThanPrevious(
  input: WorseComparisonInput
): boolean {
  const validated = validateWithdrawQuote(input)
  if (validated == null) return false
  return validated.quoteAmountOut < input.previousOppositeAmount
}

export function isValidAndWorseWithdrawQuote(
  input: WorseComparisonInput
): boolean {
  return isWorseWithdrawQuoteThanPrevious(input)
}

function validateWithdrawQuote(input: ValidationInput): {
  quoteAmountOut: bigint
} | null {
  if (input.quote1csResult == null || "err" in input.quote1csResult) {
    return null
  }

  if (input.quote1csResult.ok.quote.depositAddress == null) {
    return null
  }

  const quoteAmountIn = parseQuoteAmount(input.quote1csResult.ok.quote.amountIn)
  const quoteAmountOut = parseQuoteAmount(
    input.quote1csResult.ok.quote.amountOut
  )

  if (input.swapType === QuoteRequest.swapType.EXACT_INPUT) {
    if (quoteAmountIn == null || quoteAmountIn !== input.requestedAmountIn) {
      return null
    }
  } else if (input.swapType === QuoteRequest.swapType.EXACT_OUTPUT) {
    if (
      quoteAmountOut == null ||
      quoteAmountOut <
        adjustDecimals(
          input.requestedAmountIn,
          input.inputAmountDecimals,
          input.outputAmountDecimals
        )
    ) {
      return null
    }
  }

  if (input.minAmountOut != null) {
    if (quoteAmountOut == null || quoteAmountOut < input.minAmountOut) {
      return null
    }
  }

  if (quoteAmountOut == null) {
    return null
  }

  return { quoteAmountOut }
}
