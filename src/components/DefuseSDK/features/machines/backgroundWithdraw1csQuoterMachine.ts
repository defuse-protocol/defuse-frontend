import type { AuthMethod } from "@defuse-protocol/internal-utils"
import { QuoteRequest } from "@defuse-protocol/one-click-sdk-typescript"
import { logger } from "@src/utils/logger"
import { type ActorRef, type Snapshot, fromCallback } from "xstate"
import type { BaseTokenInfo } from "../../types/base"
import { adjustDecimals } from "../../utils/tokenUtils"
import { getWithdrawQuote as getWithdrawQuoteApi } from "./1cs"

export type WithdrawQuote1csInput = {
  tokenIn: BaseTokenInfo
  tokenOut: BaseTokenInfo
  amount: { amount: bigint; decimals: number }
  swapType: QuoteRequest.swapType
  slippageBasisPoints: number
  defuseUserId: string
  deadline: string
  userAddress: string
  userChainType: AuthMethod
  recipient: string
  recipientType: QuoteRequest.recipientType
  destinationMemo?: string
  virtualChainRecipient?: string
  destinationChainName?: string
}

export type Events =
  | {
      type: "NEW_QUOTE_INPUT"
      params: WithdrawQuote1csInput
    }
  | {
      type: "PAUSE"
    }

type EmittedEvents = {
  type: "NEW_WITHDRAW_1CS_QUOTE"
  params: {
    quoteInput: WithdrawQuote1csInput
    result:
      | {
          ok: {
            quote: {
              amountIn: string
              amountOut: string
              deadline?: string
              timeEstimate?: number
            }
            appFee: [string, bigint][]
          }
        }
      | {
          err: string
          correlationId?: string
          originalRequest?: QuoteRequest | undefined
        }
    tokenInAssetId: string
    tokenOutAssetId: string
  }
}

export type ParentEvents = EmittedEvents
type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

type Input = {
  parentRef: ParentActor
}

export const backgroundWithdraw1csQuoterMachine = fromCallback<
  Events,
  Input,
  EmittedEvents
>(({ receive, input, emit }) => {
  let lastSetRequestId = 0

  function executeQuote(quoteInput: WithdrawQuote1csInput) {
    const requestId = ++lastSetRequestId

    fetchWithdrawQuote(
      quoteInput,
      (result, tokenInAssetId, tokenOutAssetId) => {
        if (requestId !== lastSetRequestId) return

        const eventPayload = {
          type: "NEW_WITHDRAW_1CS_QUOTE" as const,
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
  }

  receive((event) => {
    const eventType = event.type
    switch (eventType) {
      case "PAUSE":
        lastSetRequestId++
        return
      case "NEW_QUOTE_INPUT": {
        executeQuote(event.params)
        break
      }
      default:
        eventType satisfies never
        logger.warn("Unhandled event type", { eventType })
    }
  })

  return () => {
    lastSetRequestId++
  }
})

async function fetchWithdrawQuote(
  quoteInput: WithdrawQuote1csInput,
  onResult: (
    result:
      | {
          ok: {
            quote: {
              amountIn: string
              amountOut: string
              timeEstimate?: number
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
    const result = await getWithdrawQuoteApi({
      dry: true,
      slippageTolerance: Math.round(quoteInput.slippageBasisPoints / 100),
      originAsset: tokenInAssetId,
      destinationAsset: tokenOutAssetId,
      amount: (quoteInput.swapType === QuoteRequest.swapType.EXACT_OUTPUT
        ? adjustDecimals(
            quoteInput.amount.amount,
            quoteInput.amount.decimals,
            quoteInput.tokenOut.decimals
          )
        : quoteInput.amount.amount
      ).toString(),
      deadline: quoteInput.deadline,
      userAddress: quoteInput.userAddress,
      authMethod: quoteInput.userChainType,
      swapType: quoteInput.swapType,
      recipient: quoteInput.recipient,
      recipientType: quoteInput.recipientType,
      ...(quoteInput.destinationMemo
        ? { destinationMemo: quoteInput.destinationMemo }
        : {}),
      ...(quoteInput.virtualChainRecipient
        ? { virtualChainRecipient: quoteInput.virtualChainRecipient }
        : {}),
      ...(quoteInput.destinationChainName
        ? { destinationChainName: quoteInput.destinationChainName }
        : {}),
    })

    onResult(result, tokenInAssetId, tokenOutAssetId)
  } catch (error) {
    logger.error("1cs withdraw quote request failed", {
      error,
      tokenInAssetId,
      tokenOutAssetId,
    })
    onResult(
      { err: error instanceof Error ? error.message : "Quote request failed" },
      tokenInAssetId,
      tokenOutAssetId
    )
  }
}
