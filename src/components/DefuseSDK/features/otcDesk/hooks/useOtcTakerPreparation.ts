import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { useQuery } from "@tanstack/react-query"
import { Err, type Result } from "@thames/monads"
import { logger } from "../../../logger"
import { getDepositedBalances } from "../../../services/defuseBalanceService"
import type { AggregatedQuote } from "../../../services/quoteService"
import type { TokenInfo } from "../../../types/base"
import type { IntentsUserId } from "../../../types/intentsUserId"
import { assert } from "../../../utils/assert"
import { isBaseToken } from "../../../utils/token"
import { getUnderlyingBaseTokenInfos } from "../../../utils/tokenUtils"
import {
  type TokenValues,
  fillWithMinimalExchanges,
} from "../utils/fillWithMinimalExchanges"
import {
  type AggregatedQuoteErr,
  type QuoteExactInParams,
  manyQuotes,
} from "../utils/quoteUtils"

export type OTCTakerPreparationOk = {
  quotes: AggregatedQuote[]
  quoteParams: QuoteExactInParams[]
  tokenDelta: [string, bigint][]
}

export type OTCTakerPreparationErr = { reason: string } | AggregatedQuoteErr

export type OTCTakerPreparationResult = Result<
  OTCTakerPreparationOk,
  OTCTakerPreparationErr
>

export function useOtcTakerPreparation({
  tokenIn,
  takerTokenDiff,
  protocolFee,
  takerId,
}: {
  tokenIn: TokenInfo
  takerTokenDiff: Record<string, bigint>
  protocolFee: number
  takerId: IntentsUserId | null
}) {
  return useQuery({
    enabled: takerId != null,
    queryKey: ["otc_taker_preparation", takerId],
    queryFn: async (): Promise<OTCTakerPreparationResult> => {
      assert(takerId != null)

      const balances = await getDepositedBalances(
        takerId,
        getUnderlyingBaseTokenInfos(tokenIn).map((t) => t.defuseAssetId),
        nearClient
      )

      const balancesWithTokenInfo = Object.keys(balances).reduce(
        (acc, token) => {
          const amount = balances[token]

          if (amount != null) {
            if (isBaseToken(tokenIn)) {
              acc[token] = {
                amount,
                decimals: tokenIn.decimals,
              }
            } else {
              const token_ = tokenIn.groupedTokens.find(
                (t) => t.defuseAssetId === token
              )
              assert(token_, "could not find token")

              acc[token] = {
                amount,
                decimals: token_.decimals,
              }
            }
          }

          return acc
        },
        {} as TokenValues
      )

      logger.verbose("balances", { balances })

      const tokensToReceive: Record<string, bigint> = {}
      const tokensToSend: Record<string, bigint> = {}

      for (const [tokenId, amount] of Object.entries(takerTokenDiff)) {
        if (amount > 0n) {
          tokensToReceive[tokenId] = amount
        } else if (amount < 0n) {
          tokensToSend[tokenId] = -amount
        }
      }

      logger.verbose("tokens breakdown", { tokensToReceive, tokensToSend })

      const fillResult = fillWithMinimalExchanges(
        balancesWithTokenInfo,
        tokensToSend,
        BigInt(protocolFee)
      )

      logger.verbose("fillResult", { fillResult })

      if (!fillResult.success) {
        return Err({
          reason: "CANNOT_FILL_ORDER_DUE_TO_INSUFFICIENT_BALANCE" as const,
        })
      }

      const tokenDelta: [string, bigint][] = Object.entries(tokensToReceive)
      const quoteParams: QuoteExactInParams[] = []

      for (const step of fillResult.steps) {
        tokenDelta.push([step.fromToken, -step.fromAmount])

        if (step.fromToken !== step.toToken) {
          quoteParams.push({
            tokenIn: step.fromToken,
            tokenOut: step.toToken,
            amountIn: step.fromAmount,
          })
        }
      }

      const quotesResult = await manyQuotes(quoteParams, {
        logBalanceSufficient: true,
      })

      return quotesResult.map((quotes) => {
        logger.verbose("return", { quotes, quoteParams, tokenDelta })
        return { quotes, quoteParams, tokenDelta }
      })
    },
  })
}
