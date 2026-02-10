"use server"

import {
  OneClickService,
  OpenAPI,
  QuoteRequest,
} from "@defuse-protocol/one-click-sdk-typescript"
import { ONE_CLICK_API_KEY, ONE_CLICK_URL } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import z from "zod"

OpenAPI.BASE = z.string().parse(ONE_CLICK_URL)
OpenAPI.TOKEN = z.string().parse(ONE_CLICK_API_KEY)

interface QuoteParams {
  tokenInId: string
  tokenOutId: string
  amountIn: string
}

type QuoteResult =
  | {
      ok: true
      amountOut: string
    }
  | {
      ok: false
      error: string
    }

export async function getSimpleQuote(
  params: QuoteParams
): Promise<QuoteResult> {
  const { tokenInId, tokenOutId, amountIn } = params

  try {
    const deadline = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const response = await OneClickService.getQuote({
      dry: true,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: 100,
      originAsset: tokenInId,
      destinationAsset: tokenOutId,
      amount: amountIn,
      depositType: QuoteRequest.depositType.INTENTS,
      refundTo: "preview.near",
      refundType: QuoteRequest.refundType.INTENTS,
      recipient: "preview.near",
      recipientType: QuoteRequest.recipientType.INTENTS,
      deadline,
    })

    return {
      ok: true,
      amountOut: response.quote.amountOut,
    }
  } catch (error) {
    logger.error("getSimpleQuote error", { error })

    const message = extractErrorMessage(error)
    if (message) {
      return { ok: false, error: message }
    }

    return {
      ok: false,
      error:
        "Apologies, but currently there is not enough liquidity available to execute your swap. We've been notified as part of our process to continually review liquidity provision.",
    }
  }
}

function extractErrorMessage(error: unknown): string | null {
  if (
    error != null &&
    typeof error === "object" &&
    "body" in error &&
    error.body != null &&
    typeof error.body === "object" &&
    "message" in error.body &&
    typeof error.body.message === "string"
  ) {
    return error.body.message
  }
  return null
}
