import {
  type TokenUsdPriceData,
  tokensPriceDataInUsd,
} from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import getTokenUsdPrice from "@src/components/DefuseSDK/utils/getTokenUsdPrice"
import { isUnifiedToken } from "@src/components/DefuseSDK/utils/token"
import {
  getTokenByAssetId,
  getUnderlyingBaseTokenInfos,
} from "@src/components/DefuseSDK/utils/tokenUtils"
import { LIST_TOKENS } from "@src/constants/tokens"
import { INTENTS_API_KEY, INTENTS_ENV } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const TIMEOUT_MS = 30_000

export async function POST(request: Request) {
  try {
    const headers: Record<string, string> = {}
    if (INTENTS_API_KEY) {
      headers.Authorization = `Bearer ${INTENTS_API_KEY}`
    }

    const rpcMethod = new URL(request.url).searchParams.get("method")

    if (!(await isValidRequest(request))) {
      return new NextResponse(null, { status: 400 })
    }

    const upstreamResponse = await fetch(
      INTENTS_ENV === "production"
        ? `https://solver-relay-v2.chaindefuser.com/rpc?method=${rpcMethod}`
        : `https://solver-relay-stage.intents-near.org/rpc?method=${rpcMethod}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: request.body,
        // @ts-ignore
        duplex: "half", // Required for streaming request bodies
        signal: AbortSignal.timeout(TIMEOUT_MS),
      }
    )

    // Create response headers properly
    const responseHeaders = new Headers()

    // Copy specific headers from upstream response
    upstreamResponse.headers.forEach((value, key) => {
      // Skip headers that Next.js will set automatically
      if (
        !["content-encoding", "content-length", "transfer-encoding"].includes(
          key.toLowerCase()
        )
      ) {
        responseHeaders.set(key, value)
      }
    })

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    })
  } catch (err: unknown) {
    logger.error(err)

    // Generic error without ID (since we didn't parse the body)
    let statusCode = 500
    let errorMessage = "Internal server error"
    let errorCode = -32603

    if (err instanceof Error) {
      if (err.name === "AbortError") {
        statusCode = 504
        errorMessage = "Request timeout"
        errorCode = -32000
      }
    }

    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: {
          code: errorCode,
          message: errorMessage,
        },
      },
      { status: statusCode }
    )
  }
}

async function isValidRequest(request: Request): Promise<boolean> {
  const requestBody = await request
    .clone()
    .json()
    .catch(() => null)

  if (!requestBody) {
    return false
  }

  const isQuoteRequest = quoteMethodSchema.safeParse(requestBody).success
  if (!isQuoteRequest) {
    // allow non-quote requests
    return true
  }

  return await validateQuoteRequest(requestBody)
}

const MAX_FEE_USD_VALUE = 5

async function validateQuoteRequest(requestBody: unknown): Promise<boolean> {
  const quoteParseResult = quoteRequestSchema.safeParse(requestBody)
  if (!quoteParseResult.success) {
    // reject quote requests that we don't use on frontend
    return false
  }

  const {
    defuse_asset_identifier_in,
    defuse_asset_identifier_out,
    exact_amount_in,
  } = quoteParseResult.data.params[0]

  const tokenIn = getTokenByAssetId(LIST_TOKENS, defuse_asset_identifier_in)
  const tokenOut = getTokenByAssetId(LIST_TOKENS, defuse_asset_identifier_out)

  if (!tokenIn || !tokenOut) {
    return false
  }

  // Only if both tokens are unified tokens of the same type we allow this for our frontend
  if (isUnifiedToken(tokenIn) && tokenIn === tokenOut) {
    return true
  }

  let tokensUsdPriceData: TokenUsdPriceData
  try {
    tokensUsdPriceData = await getCachedTokenPriceData()
  } catch (error) {
    logger.error("Failed to fetch token prices", { error })
    return false
  }

  const baseTokenIn = getUnderlyingBaseTokenInfos(tokenIn).find(
    (t) => t.defuseAssetId === defuse_asset_identifier_in
  )

  if (!baseTokenIn) {
    return false
  }

  const usdValue = getTokenUsdPrice(
    formatTokenValue(BigInt(exact_amount_in), baseTokenIn.decimals),
    tokenIn,
    tokensUsdPriceData
  )

  if (usdValue == null) {
    return false
  }

  // reject if USD value is more than MAX_FEE_USD_VALUE
  // (because the fees will not be more than MAX_FEE_USD_VALUE)
  return usdValue <= MAX_FEE_USD_VALUE
}

const quoteMethodSchema = z.object({ method: z.literal("quote") })

const quoteRequestSchema = z.object({
  method: z.literal("quote"),
  params: z
    .array(
      z.object({
        defuse_asset_identifier_out: z.string(),
        defuse_asset_identifier_in: z.string(),
        // Must be a decimal integer string so BigInt() cannot throw
        exact_amount_in: z
          .string()
          .regex(
            /^[0-9]+$/,
            "exact_amount_in must be a decimal integer string"
          ),
      })
    )
    .min(1),
})

const TOKEN_PRICE_CACHE_TTL_MS = 20_000 // 20 seconds

// In-memory cache for token price data
let tokenPriceCacheTimestamp: number | null = null
let tokenPriceCachePromise: Promise<TokenUsdPriceData> | undefined = undefined

async function getCachedTokenPriceData(): Promise<TokenUsdPriceData> {
  const now = Date.now()

  // Check if cached data is still valid
  if (
    tokenPriceCacheTimestamp !== null &&
    tokenPriceCachePromise &&
    now - tokenPriceCacheTimestamp < TOKEN_PRICE_CACHE_TTL_MS
  ) {
    return tokenPriceCachePromise
  }

  tokenPriceCacheTimestamp = Date.now()
  const prevTokenPriceCachePromise = tokenPriceCachePromise
  tokenPriceCachePromise = tokensPriceDataInUsd().catch(async (error) => {
    logger.error("Failed to fetch token prices", { error })
    const r = await prevTokenPriceCachePromise
    if (r === undefined) {
      throw error
    }
    return r
  })
  return tokenPriceCachePromise
}
