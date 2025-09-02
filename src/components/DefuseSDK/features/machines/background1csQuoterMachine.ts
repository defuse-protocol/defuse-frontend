import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { getQuote as get1csQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
import { type ActorRef, type Snapshot, fromCallback } from "xstate"

import { logger } from "../../logger"
import type { BaseTokenInfo, UnifiedTokenInfo } from "../../types/base"
import { isBaseToken } from "../../utils/token"

function getTokenAssetId(token: BaseTokenInfo | UnifiedTokenInfo) {
  return isBaseToken(token)
    ? token.defuseAssetId
    : token.groupedTokens[0].defuseAssetId
}

export type Quote1csInput = {
  tokenIn: BaseTokenInfo | UnifiedTokenInfo
  tokenOut: BaseTokenInfo
  amountIn: { amount: bigint; decimals: number }
  slippageBasisPoints: number
  defuseUserId: string
  deadline: string
  referral?: string
  authMethod: AuthMethod
}

export type Events =
  | {
      type: "NEW_QUOTE_INPUT"
      params: Quote1csInput
    }
  | {
      type: "PAUSE"
    }

type EmittedEvents = {
  type: "NEW_1CS_QUOTE"
  params: {
    quoteInput: Quote1csInput
    result:
      | {
          ok: {
            quote: {
              amountIn?: string
              amountOut?: string
              deadline?: string
            }
            appFee: [string, bigint][]
          }
        }
      | { err: string }
    tokenInAssetId: string
    tokenOutAssetId: string
  }
}

export type ParentEvents = {
  type: "NEW_1CS_QUOTE"
  params: {
    quoteInput: Quote1csInput
    result:
      | {
          ok: {
            quote: {
              amountIn: string
              amountOut: string
            }
            appFee: [string, bigint][]
          }
        }
      | { err: string }
    tokenInAssetId: string
    tokenOutAssetId: string
  }
}
type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

type Input = {
  parentRef: ParentActor
}

export const background1csQuoterMachine = fromCallback<
  Events,
  Input,
  EmittedEvents
>(({ receive, input, emit }) => {
  let abortController = new AbortController()

  receive((event) => {
    abortController.abort()
    abortController = new AbortController()

    const eventType = event.type
    switch (eventType) {
      case "PAUSE":
        return
      case "NEW_QUOTE_INPUT": {
        const quoteInput = event.params

        get1csQuote(
          abortController.signal,
          quoteInput,
          (result, tokenInAssetId, tokenOutAssetId) => {
            const eventPayload = {
              type: "NEW_1CS_QUOTE" as const,
              params: {
                quoteInput,
                result,
                tokenInAssetId,
                tokenOutAssetId,
              },
            }

            input.parentRef.send(eventPayload)
            emit(eventPayload)
          }
        )
        break
      }
      default:
        eventType satisfies never
        logger.warn("Unhandled event type", { eventType })
    }
  })

  return () => {
    abortController.abort()
  }
})

async function get1csQuote(
  signal: AbortSignal,
  quoteInput: Quote1csInput,
  onResult: (
    result:
      | {
          ok: {
            quote: {
              amountIn: string
              amountOut: string
            }
            appFee: [string, bigint][]
          }
        }
      | { err: string },
    tokenInAssetId: string,
    tokenOutAssetId: string
  ) => void
): Promise<void> {
  const tokenInAssetId = getTokenAssetId(quoteInput.tokenIn)
  const tokenOutAssetId = getTokenAssetId(quoteInput.tokenOut)

  try {
    const result = await get1csQuoteApi(
      {
        dry: true,
        swapType: QuoteRequest.swapType.EXACT_INPUT,
        slippageTolerance: Math.round(quoteInput.slippageBasisPoints / 100),
        quoteWaitingTimeMs: 3000,
        originAsset: tokenInAssetId,
        depositType: QuoteRequest.depositType.INTENTS,
        destinationAsset: tokenOutAssetId,
        amount: quoteInput.amountIn.amount.toString(),
        refundTo: quoteInput.defuseUserId,
        refundType: QuoteRequest.refundType.INTENTS,
        recipient: quoteInput.defuseUserId,
        recipientType: QuoteRequest.recipientType.INTENTS,
        deadline: quoteInput.deadline,
        referral: quoteInput.referral,
      },
      quoteInput.authMethod
    )

    if (signal.aborted) {
      return
    }

    onResult(result, tokenInAssetId, tokenOutAssetId)
  } catch {
    logger.error("1cs quote request failed")
    onResult({ err: "Quote request failed" }, tokenInAssetId, tokenOutAssetId)
  }
}
