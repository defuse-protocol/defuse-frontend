"use server"

import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import {
  AccountService,
  GenerateSwapTransferIntentRequest,
  type GetBalancesResponse,
  IntentStandardEnum,
  type MultiPayload,
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type QuoteResponse,
  SubmitSwapTransferIntentRequest,
  UserAuthService,
} from "@defuse-protocol/one-click-sdk-typescript"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { getTokenByAssetId } from "@src/components/DefuseSDK/utils/tokenUtils"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { referralMap } from "@src/hooks/useIntentsReferral"
import {
  APP_FEE_BPS,
  ONE_CLICK_API_KEY,
  ONE_CLICK_URL,
} from "@src/utils/environment"
import { getAppFeeRecipients } from "@src/utils/getAppFeeRecipient"
import { logger } from "@src/utils/logger"
import { splitAppFeeBps } from "@src/utils/splitAppFee"
import { cookies } from "next/headers"
import z from "zod"

// Cookie names for confidential intents session
const ACCESS_TOKEN_COOKIE = "confidential_intents_access"
const REFRESH_TOKEN_COOKIE = "confidential_intents_refresh"
const TOKEN_EXPIRES_AT_COOKIE = "confidential_intents_expires_at"

// Refresh threshold - refresh when less than this many seconds remain
const REFRESH_THRESHOLD_SECONDS = 60

OpenAPI.BASE = z.string().parse(ONE_CLICK_URL)
OpenAPI.HEADERS = {
  "x-api-key": z.string().parse(ONE_CLICK_API_KEY),
}
// Resolve Authorization header per-request: JWT from cookies when authenticated,
// otherwise API key for public endpoints.
OpenAPI.TOKEN = async () => {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
    if (accessToken) {
      return accessToken
    }
  } catch {
    // cookies() unavailable outside request context (e.g. build time)
  }
  return z.string().parse(ONE_CLICK_API_KEY)
}

const authMethodSchema = z.enum([
  "near",
  "evm",
  "solana",
  "webauthn",
  "ton",
  "stellar",
  "tron",
])

/**
 * Session data stored in cookies
 */
interface SessionTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number // Unix timestamp in ms
}

/**
 * Helper to get session tokens from HTTP-only cookies
 */
async function getSessionTokens(): Promise<SessionTokens | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value
  const expiresAtStr = cookieStore.get(TOKEN_EXPIRES_AT_COOKIE)?.value

  if (!accessToken || !refreshToken || !expiresAtStr) {
    return null
  }

  const expiresAt = Number.parseInt(expiresAtStr, 10)
  if (Number.isNaN(expiresAt)) {
    return null
  }

  return { accessToken, refreshToken, expiresAt }
}

/**
 * Helper to save session tokens to HTTP-only cookies
 */
async function saveSessionTokens(
  accessToken: string,
  refreshToken: string,
  expiresInSeconds: number,
  refreshExpiresInSeconds?: number
): Promise<void> {
  const cookieStore = await cookies()
  const isProduction = process.env.NODE_ENV === "production"
  const expiresAt = Date.now() + expiresInSeconds * 1000

  // Access token cookie - expires when the token expires
  cookieStore.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: expiresInSeconds,
    path: "/",
  })

  // Refresh token cookie - longer lived
  const refreshMaxAge = refreshExpiresInSeconds ?? 60 * 60 * 24 * 7 // 7 days default
  cookieStore.set(REFRESH_TOKEN_COOKIE, refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: refreshMaxAge,
    path: "/",
  })

  // Expiration timestamp cookie (not sensitive, but httpOnly for consistency)
  cookieStore.set(TOKEN_EXPIRES_AT_COOKIE, expiresAt.toString(), {
    httpOnly: true,
    secure: isProduction,
    sameSite: "strict",
    maxAge: refreshMaxAge,
    path: "/",
  })
}

/**
 * Clear all session cookies
 */
async function clearSessionCookies(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(ACCESS_TOKEN_COOKIE)
  cookieStore.delete(REFRESH_TOKEN_COOKIE)
  cookieStore.delete(TOKEN_EXPIRES_AT_COOKIE)
}

/**
 * Check if access token needs refresh (expired or about to expire)
 */
function isTokenExpiredOrExpiring(expiresAt: number): boolean {
  const now = Date.now()
  const thresholdMs = REFRESH_THRESHOLD_SECONDS * 1000
  return now >= expiresAt - thresholdMs
}

/**
 * Try to refresh the access token using refresh token
 */
async function tryRefreshAccessToken(
  refreshToken: string
): Promise<{ accessToken: string; expiresIn: number } | null> {
  try {
    const response = await UserAuthService.refresh({
      refreshToken: refreshToken,
    })
    return {
      accessToken: response.accessToken,
      expiresIn: response.expiresIn,
    }
  } catch (error) {
    logger.error(
      `privateIntents: refresh token failed: ${unknownServerErrorToString(error)}`
    )
    return null
  }
}

/**
 * Get valid access token, refreshing if necessary
 * Returns null if not authenticated or refresh fails
 */
async function getValidAccessToken(): Promise<string | null> {
  const session = await getSessionTokens()
  if (!session) {
    return null
  }

  // Check if token is still valid
  if (!isTokenExpiredOrExpiring(session.expiresAt)) {
    return session.accessToken
  }

  // Token expired or expiring soon - try to refresh
  logger.info("privateIntents: access token expired, attempting refresh")
  const refreshResult = await tryRefreshAccessToken(session.refreshToken)

  if (!refreshResult) {
    // Refresh failed - clear session and require re-authentication
    logger.warn("privateIntents: refresh failed, clearing session")
    await clearSessionCookies()
    return null
  }

  // Save new access token (keep existing refresh token)
  await saveSessionTokens(
    refreshResult.accessToken,
    session.refreshToken,
    refreshResult.expiresIn
  )

  logger.info("privateIntents: access token refreshed successfully")
  return refreshResult.accessToken
}

/**
 * Authenticate user with signed data and set HTTP-only cookies
 */
export async function authenticatePrivateIntents(args: {
  signedData: MultiPayload
}): Promise<{ ok: { authenticated: true } } | { err: string }> {
  try {
    const response = await UserAuthService.authenticate({
      signedData: args.signedData,
    })

    // Save both access and refresh tokens
    await saveSessionTokens(
      response.accessToken,
      response.refreshToken,
      response.expiresIn,
      response.refreshExpiresIn
    )

    return { ok: { authenticated: true } }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: authenticate error: ${err}`)
    return { err }
  }
}

/**
 * Check if user is authenticated (has valid session cookies)
 * Note: This only checks if cookies exist, not if tokens are valid
 */
export async function isPrivateIntentsAuthenticated(): Promise<boolean> {
  const session = await getSessionTokens()
  return session !== null
}

/**
 * Logout - remove all session cookies
 */
export async function logoutPrivateIntents(): Promise<void> {
  await clearSessionCookies()
}

/**
 * Get private balance for authenticated user (uses cookie, auto-refreshes token)
 */
export async function getPrivateBalance(args?: {
  tokenIds?: string[]
}): Promise<{ ok: GetBalancesResponse } | { err: string }> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { err: "Not authenticated. Please authenticate first." }
  }

  try {
    const response = await AccountService.getBalances(args?.tokenIds)
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getBalance error: ${err}`)

    // If unauthorized, try to clear session (token might be invalid)
    if (isUnauthorizedError(error)) {
      logger.warn("privateIntents: unauthorized error, clearing session")
      await clearSessionCookies()
      return { err: "Session expired. Please authenticate again." }
    }

    return { err }
  }
}

const swapTypeSchema = z.nativeEnum(QuoteRequest.swapType)

const confidentialSwapQuoteArgsSchema = z.object({
  dry: z.boolean(),
  slippageTolerance: z.number(),
  originAsset: z.string(),
  destinationAsset: z.string(),
  amount: z.string(),
  deadline: z.string(),
  userAddress: z.string(),
  authMethod: authMethodSchema,
  swapType: swapTypeSchema,
})

type ConfidentialSwapQuoteArgs = z.infer<typeof confidentialSwapQuoteArgsSchema>

// Ensure the zod schema inferred type exactly matches AuthMethod
type AuthMethodSchema = z.infer<typeof authMethodSchema>
const _: AuthMethodSchema extends AuthMethod
  ? AuthMethod extends AuthMethodSchema
    ? true
    : never
  : never = true

/**
 * Get quote for confidential swap (CONFIDENTIAL_INTENTS for all types)
 * Mirrors 1cs.ts:getQuote() but routes through confidential intents with JWT auth
 */
export async function getConfidentialSwapQuote(
  args: ConfidentialSwapQuoteArgs
): Promise<
  | { ok: QuoteResponse & { appFee: [string, bigint][] } }
  | { err: string; originalRequest?: QuoteRequest | undefined }
> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { err: "Not authenticated. Please authenticate first." }
  }

  const parseResult = confidentialSwapQuoteArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { userAddress, authMethod, ...quoteRequest } = parseResult.data
  let req: QuoteRequest | undefined = undefined
  try {
    const tokenIn = getTokenByAssetId(LIST_TOKENS, quoteRequest.originAsset)
    if (!tokenIn) {
      return { err: `Token in ${quoteRequest.originAsset} not found` }
    }

    const tokenOut = getTokenByAssetId(
      LIST_TOKENS,
      quoteRequest.destinationAsset
    )
    if (!tokenOut) {
      return { err: `Token out ${quoteRequest.destinationAsset} not found` }
    }

    const template = await whitelabelTemplateFlag()
    const appFeeRecipients = getAppFeeRecipients(template)

    const primaryRecipient = appFeeRecipients[0]?.recipient ?? ""
    const appFeeBps = computeAppFeeBps(
      APP_FEE_BPS,
      tokenIn,
      tokenOut,
      primaryRecipient,
      { identifier: userAddress, method: authMethod }
    )

    if (appFeeBps > 0 && appFeeRecipients.length === 0) {
      return { err: "App fee recipient is not configured" }
    }

    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      authMethod
    )

    const appFees =
      appFeeRecipients.length > 0
        ? splitAppFeeBps(appFeeBps, appFeeRecipients)
        : []

    req = {
      ...quoteRequest,
      depositType: QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
      recipient: intentsUserId,
      recipientType: QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
      quoteWaitingTimeMs: 0,
      referral: referralMap[template],
      ...(appFees.length > 0 ? { appFees } : {}),
    }

    return {
      ok: {
        ...(await OneClickService.getQuote(req)),
        appFee:
          appFeeBps > 0 && primaryRecipient
            ? [[primaryRecipient, BigInt(appFeeBps)]]
            : [],
      },
    }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getConfidentialSwapQuote error: ${err}`)

    if (isUnauthorizedError(error)) {
      logger.warn("privateIntents: unauthorized error, clearing session")
      await clearSessionCookies()
      return { err: "Session expired. Please authenticate again." }
    }

    return { err, originalRequest: req }
  }
}

const shieldQuoteArgsSchema = z.object({
  amount: z.string(),
  asset: z.string(),
  userAddress: z.string(),
  authMethod: authMethodSchema,
  deadline: z.string(),
  slippageTolerance: z.number(),
})

type ShieldQuoteArgs = z.infer<typeof shieldQuoteArgsSchema>

/**
 * Get quote for shielding tokens (public INTENTS → private CONFIDENTIAL_INTENTS)
 */
export async function getShieldQuote(
  args: ShieldQuoteArgs
): Promise<{ ok: QuoteResponse } | { err: string }> {
  const parseResult = shieldQuoteArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { userAddress, authMethod, ...rest } = parseResult.data

  try {
    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      authMethod
    )

    const req: QuoteRequest = {
      dry: false,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: rest.slippageTolerance,
      originAsset: rest.asset,
      destinationAsset: rest.asset, // Same asset for shield
      amount: rest.amount,
      deadline: rest.deadline,
      // Shield: deposit from public intents, receive to private intents
      depositType: QuoteRequest.depositType.INTENTS,
      recipientType: QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
      recipient: intentsUserId,
      quoteWaitingTimeMs: 0,
    }

    const response = await OneClickService.getQuote(req)
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getShieldQuote error: ${err}`)
    return { err }
  }
}

const unshieldQuoteArgsSchema = z.object({
  amount: z.string(),
  asset: z.string(),
  userAddress: z.string(),
  authMethod: authMethodSchema,
  deadline: z.string(),
  slippageTolerance: z.number(),
})

type UnshieldQuoteArgs = z.infer<typeof unshieldQuoteArgsSchema>

/**
 * Get quote for unshielding tokens (private CONFIDENTIAL_INTENTS → public INTENTS)
 * Uses session cookie for authorization, auto-refreshes token
 */
export async function getUnshieldQuote(
  args: UnshieldQuoteArgs
): Promise<{ ok: QuoteResponse } | { err: string }> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { err: "Not authenticated. Please authenticate first." }
  }

  const parseResult = unshieldQuoteArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { userAddress, authMethod, ...rest } = parseResult.data

  try {
    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      authMethod
    )

    const req: QuoteRequest = {
      dry: false,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: rest.slippageTolerance,
      originAsset: rest.asset,
      destinationAsset: rest.asset, // Same asset for unshield
      amount: rest.amount,
      deadline: rest.deadline,
      // Unshield: deposit from private intents, receive to public intents
      depositType: QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
      recipientType: QuoteRequest.recipientType.INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
      recipient: intentsUserId,
      quoteWaitingTimeMs: 0,
    }

    const response = await OneClickService.getQuote(req)
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getUnshieldQuote error: ${err}`)

    // If unauthorized, try to clear session
    if (isUnauthorizedError(error)) {
      logger.warn("privateIntents: unauthorized error, clearing session")
      await clearSessionCookies()
      return { err: "Session expired. Please authenticate again." }
    }

    return { err }
  }
}

const privateTransferQuoteArgsSchema = z.object({
  amount: z.string(),
  asset: z.string(),
  userAddress: z.string(),
  authMethod: authMethodSchema,
  recipientIntentsUserId: z.string(),
  deadline: z.string(),
  slippageTolerance: z.number(),
})

type PrivateTransferQuoteArgs = z.infer<typeof privateTransferQuoteArgsSchema>

/**
 * Get quote for private transfer (private CONFIDENTIAL_INTENTS → private CONFIDENTIAL_INTENTS)
 * Uses session cookie for authorization, auto-refreshes token
 */
export async function getPrivateTransferQuote(
  args: PrivateTransferQuoteArgs
): Promise<{ ok: QuoteResponse } | { err: string }> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { err: "Not authenticated. Please authenticate first." }
  }

  const parseResult = privateTransferQuoteArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { userAddress, authMethod, recipientIntentsUserId, ...rest } =
    parseResult.data

  try {
    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      authMethod
    )

    const req: QuoteRequest = {
      dry: false,
      swapType: QuoteRequest.swapType.EXACT_INPUT,
      slippageTolerance: rest.slippageTolerance,
      originAsset: rest.asset,
      destinationAsset: rest.asset,
      amount: rest.amount,
      deadline: rest.deadline,
      depositType: QuoteRequest.depositType.CONFIDENTIAL_INTENTS,
      recipientType: QuoteRequest.recipientType.CONFIDENTIAL_INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.CONFIDENTIAL_INTENTS,
      recipient: recipientIntentsUserId,
      quoteWaitingTimeMs: 0,
    }

    const response = await OneClickService.getQuote(req)
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getPrivateTransferQuote error: ${err}`)

    if (isUnauthorizedError(error)) {
      logger.warn("privateIntents: unauthorized error, clearing session")
      await clearSessionCookies()
      return { err: "Session expired. Please authenticate again." }
    }

    return { err }
  }
}

const generateIntentArgsSchema = z.object({
  depositAddress: z.string(),
  signerId: z.string(),
  standard: z.nativeEnum(IntentStandardEnum),
})

/**
 * Generate intent for shield/unshield/transfer operation
 */
export async function generateIntent(
  args: z.infer<typeof generateIntentArgsSchema>
) {
  const parseResult = generateIntentArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  try {
    const response = await OneClickService.generateIntent({
      type: GenerateSwapTransferIntentRequest.type.SWAP_TRANSFER,
      standard: args.standard,
      depositAddress: args.depositAddress,
      signerId: args.signerId,
    })
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: generateIntent error: ${err}`)
    return { err }
  }
}

/**
 * Submit signed intent
 */
export async function submitIntent(args: { signedIntent: MultiPayload }) {
  try {
    const response = await OneClickService.submitIntent({
      type: SubmitSwapTransferIntentRequest.type.SWAP_TRANSFER,
      signedData: args.signedIntent,
    })
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: submitIntent error: ${err}`)
    return { err }
  }
}

/**
 * Get execution status for an operation
 */
export async function getExecutionStatus(depositAddress: string) {
  try {
    const response = await OneClickService.getExecutionStatus(depositAddress)
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: getExecutionStatus error: ${err}`)
    return { err }
  }
}

const serverErrorSchema = z.object({
  body: z.object({
    message: z.string(),
  }),
})

const serverErrorWithStatusSchema = z.object({
  status: z.number(),
  body: z.object({
    message: z.string(),
  }),
})

type ServerError = z.infer<typeof serverErrorSchema>

function isServerError(error: unknown): error is ServerError {
  return serverErrorSchema.safeParse(error).success
}

function isUnauthorizedError(error: unknown): boolean {
  const parsed = serverErrorWithStatusSchema.safeParse(error)
  return parsed.success && parsed.data.status === 401
}

function unknownServerErrorToString(error: unknown): string {
  return isServerError(error)
    ? error.body.message
    : error instanceof Error
      ? error.message
      : String(error)
}
