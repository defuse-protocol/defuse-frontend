import type { AuthMethod } from "@defuse-protocol/internal-utils"
import type {
  QuoteRequest,
  QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { getWithdrawQuote as getWithdrawQuoteApi } from "@src/components/DefuseSDK/features/machines/1cs"
import { logger } from "@src/utils/logger"
import { type ActorRef, type Snapshot, fromCallback } from "xstate"
import type { BaseTokenInfo } from "../../types/base"

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
  type: "NEW_1CS_WITHDRAW_QUOTE"
  params: {
    quoteInput: WithdrawQuote1csInput
    result:
      | { ok: QuoteResponse }
      | { err: string; originalRequest?: QuoteRequest }
    tokenInAssetId: string
    tokenOutAssetId: string
  }
}

export type ParentEvents = EmittedEvents
type ParentActor = ActorRef<Snapshot<unknown>, ParentEvents>

type Input = {
  parentRef: ParentActor
}

export const background1csWithdrawQuoterMachine = fromCallback<
  Events,
  Input,
  EmittedEvents
>(({ receive, input, emit }) => {
  let lastSetRequestId = 0

  function executeQuote(quoteInput: WithdrawQuote1csInput) {
    const requestId = ++lastSetRequestId

    getWithdrawQuote(quoteInput, (result, tokenInAssetId, tokenOutAssetId) => {
      if (requestId !== lastSetRequestId) return

      const eventPayload = {
        type: "NEW_1CS_WITHDRAW_QUOTE" as const,
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

  return () => lastSetRequestId++
})

async function getWithdrawQuote(
  quoteInput: WithdrawQuote1csInput,
  onResult: (
    result: { ok: QuoteResponse } | { err: string },
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
      amount: quoteInput.amount.amount.toString(),
      deadline: quoteInput.deadline,
      userAddress: quoteInput.userAddress,
      authMethod: quoteInput.userChainType,
      swapType: quoteInput.swapType,
      recipient: quoteInput.recipient,
    })

    onResult(result, tokenInAssetId, tokenOutAssetId)
  } catch {
    logger.error("1cs withdraw quote request failed")
    onResult({ err: "Quote request failed" }, tokenInAssetId, tokenOutAssetId)
  }
}
