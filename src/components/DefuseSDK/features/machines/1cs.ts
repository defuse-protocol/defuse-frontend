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
import { isBaseToken } from "../../utils/token"

OpenAPI.BASE =
  process.env.ONE_CLICK_URL ??
  (() => {
    throw new Error("ONE_CLICK_URL is not set")
  })()

OpenAPI.TOKEN =
  process.env.ONE_CLICK_API_KEY ??
  (() => {
    throw new Error("ONE_CLICK_API_KEY is not set")
  })()

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

    return {
      ok: {
        ...(await OneClickService.getQuote({
          ...quoteRequest,
          ...(appFeeBps > 0
            ? { appFees: [{ recipient: APP_FEE_RECIPIENT, fee: appFeeBps }] }
            : {}),
        })),
        appFee: appFeeBps > 0 ? [[APP_FEE_RECIPIENT, BigInt(appFeeBps)]] : [],
      },
    }
  } catch (error) {
    return { err: error instanceof Error ? error.message : String(error) }
  }
}

function getTokenByAssetId(assetId: string) {
  return LIST_TOKENS.find((token) =>
    isBaseToken(token)
      ? token.defuseAssetId === assetId
      : token.groupedTokens.some((token) => token.defuseAssetId === assetId)
  )
}
