"use server"

import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import {
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { referralMap } from "@src/hooks/useIntentsReferral"
import {
  APP_FEE_BPS,
  APP_FEE_RECIPIENT,
  ONE_CLICK_API_KEY,
  ONE_CLICK_URL,
} from "@src/utils/environment"
import { unstable_cache } from "next/cache"
import z from "zod"
import { isBaseToken } from "../../utils/token"

OpenAPI.BASE = z.string().parse(ONE_CLICK_URL)
OpenAPI.TOKEN = z.string().parse(ONE_CLICK_API_KEY)

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

const authMethodSchema = z.enum([
  "near",
  "evm",
  "solana",
  "webauthn",
  "ton",
  "stellar",
  "tron",
])

// Ensure the zod schema inferred type exactly matches AuthMethod
type AuthMethodSchema = z.infer<typeof authMethodSchema>
// This will cause a compile error if the types don't match exactly
const _: AuthMethodSchema extends AuthMethod
  ? AuthMethod extends AuthMethodSchema
    ? true
    : never
  : never = true

const getQuoteArgsSchema = z.object({
  dry: z.boolean(),
  slippageTolerance: z.number(),
  quoteWaitingTimeMs: z.number(),
  originAsset: z.string(),
  destinationAsset: z.string(),
  amount: z.string(),
  deadline: z.string(),
  userAddress: z.string(),
  authMethod: authMethodSchema,
})

export async function getQuote(
  args: unknown
): Promise<
  { ok: QuoteResponse & { appFee: [string, bigint][] } } | { err: string }
> {
  const parseResult = getQuoteArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { userAddress, authMethod, ...quoteRequest } = parseResult.data
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
      { identifier: userAddress, method: authMethod }
    )

    if (appFeeBps > 0 && !APP_FEE_RECIPIENT) {
      return { err: "App fee recipient is not configured" }
    }

    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      authMethod
    )

    const req: QuoteRequest = {
      ...quoteRequest,
      depositType: QuoteRequest.depositType.INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.INTENTS,
      recipient: intentsUserId,
      recipientType: QuoteRequest.recipientType.INTENTS,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      referral: referralMap[await whitelabelTemplateFlag()],
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
