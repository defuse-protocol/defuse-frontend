import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { getQuote as get1csQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
import throttle from "lodash-es/throttle"
import { type ActorRef, type Snapshot, fromCallback } from "xstate"

import { logger } from "../../logger"
import type { BaseTokenInfo } from "../../types/base"

export type Quote1csInput = {
  tokenIn: BaseTokenInfo
  tokenOut: BaseTokenInfo
  amountIn: { amount: bigint; decimals: number }
  slippageBasisPoints: number
  defuseUserId: string
  deadline: string
  userAddress: string
  userChainType: AuthMethod
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
  function executeQuote(quoteInput: Quote1csInput) {
    get1csQuote(quoteInput, (result, tokenInAssetId, tokenOutAssetId) => {
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
    })
  }

  const throttledGetQuote = throttle(executeQuote, 500, {
    leading: true, // Execute immediately on first call
    trailing: true, // Execute after delay if there were calls during the wait
  })

  receive((event) => {
    const eventType = event.type
    switch (eventType) {
      case "PAUSE":
        throttledGetQuote.cancel()
        return
      case "NEW_QUOTE_INPUT": {
        throttledGetQuote(event.params)
        break
      }
      default:
        eventType satisfies never
        logger.warn("Unhandled event type", { eventType })
    }
  })
})

async function get1csQuote(
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
  const tokenInAssetId = quoteInput.tokenIn.defuseAssetId
  const tokenOutAssetId = quoteInput.tokenOut.defuseAssetId

  try {
    const result = await get1csQuoteApi({
      dry: true,
      slippageTolerance: Math.round(quoteInput.slippageBasisPoints / 100),
      quoteWaitingTimeMs: 3000,
      originAsset: tokenInAssetId,
      destinationAsset: tokenOutAssetId,
      amount: quoteInput.amountIn.amount.toString(),
      deadline: quoteInput.deadline,
      userAddress: quoteInput.userAddress,
      authMethod: quoteInput.userChainType,
    })

    onResult(result, tokenInAssetId, tokenOutAssetId)
  } catch {
    logger.error("1cs quote request failed")
    onResult({ err: "Quote request failed" }, tokenInAssetId, tokenOutAssetId)
  }
}
