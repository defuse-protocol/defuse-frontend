"use server"

import type { AuthMethod } from "@defuse-protocol/internal-utils"
import {
  OneClickService,
  OpenAPI,
  type QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { LIST_TOKENS } from "@src/constants/tokens"
import { APP_FEE_BPS, APP_FEE_RECIPIENT } from "@src/utils/environment"
import { unstable_cache } from "next/cache"
import * as v from "valibot"
import z from "zod"
import { isBaseToken } from "../../utils/token"

OpenAPI.BASE = v.parse(
  v.pipe(v.string(), v.nonEmpty()),
  process.env.ONE_CLICK_URL
)
OpenAPI.TOKEN = v.parse(
  v.pipe(v.string(), v.nonEmpty()),
  process.env.ONE_CLICK_API_KEY
)

export async function getTokens() {
  return await getTokensCached()
}

const getTokensCached = unstable_cache(
  async () => {
    return await OneClickService.getTokens()
  },
  ["1click-tokens"],
  {
    revalidate: 60, // 1 minute cache
    tags: ["1click-tokens"],
  }
)

export async function getQuote(
  quoteRequest: QuoteRequest,
  authMethod: AuthMethod
): Promise<
  { ok: QuoteResponse & { appFee: [string, bigint][] } } | { err: string }
> {
  try {
    const tokenIn = getTokenByAssetId(quoteRequest.originAsset)
    if (!tokenIn) {
      return { err: `Token in ${quoteRequest.originAsset} not found` }
    }

    const tokenOut = getTokenByAssetId(quoteRequest.destinationAsset)
    if (!tokenOut) {
      return { err: `Token out ${quoteRequest.destinationAsset} not found` }
    }

    const appFeeBps = computeAppFeeBps(
      APP_FEE_BPS,
      tokenIn,
      tokenOut,
      APP_FEE_RECIPIENT,
      {
        identifier: quoteRequest.recipient,
        method: authMethod,
      }
    )

    if (appFeeBps > 0 && !APP_FEE_RECIPIENT) {
      return { err: "App fee recipient is not configured" }
    }

    const req: QuoteRequest = {
      ...quoteRequest,
      ...(appFeeBps > 0
        ? { appFees: [{ recipient: APP_FEE_RECIPIENT, fee: appFeeBps }] }
        : {}),
    }

    return {
      ok: {
        ...(await OneClickService.getQuote(req)),
        appFee: appFeeBps > 0 ? [[APP_FEE_RECIPIENT, BigInt(appFeeBps)]] : [],
      },
    }
  } catch (error) {
    return {
      err: isServerError(error)
        ? error.body.message
        : error instanceof Error
          ? error.message
          : String(error),
    }
  }
}

const serverErrorSchema = z.object({
  body: z.object({
    message: z.string(),
  }),
})

type ServerError = z.infer<typeof serverErrorSchema>

function isServerError(error: unknown): error is ServerError {
  return serverErrorSchema.safeParse(error).success
}

function getTokenByAssetId(assetId: string) {
  return LIST_TOKENS.find((token) =>
    isBaseToken(token)
      ? token.defuseAssetId === assetId
      : token.groupedTokens.some((token) => token.defuseAssetId === assetId)
  )
}
