"use server"

import { authIdentity } from "@defuse-protocol/internal-utils"
import {
  GenerateSwapTransferIntentRequest,
  type GetBalanceResponseDto,
  IntentStandardEnum,
  type MultiPayload,
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type QuoteResponse,
  SubmitSwapTransferIntentRequest,
  UserAuthService,
} from "@defuse-protocol/one-click-sdk-typescript"
import { ONE_CLICK_API_KEY, ONE_CLICK_URL } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { cookies } from "next/headers"
import z from "zod"

// Cookie names for private intents session
const ACCESS_TOKEN_COOKIE = "private_intents_access"
const REFRESH_TOKEN_COOKIE = "private_intents_refresh"
const TOKEN_EXPIRES_AT_COOKIE = "private_intents_expires_at"

// Refresh threshold - refresh when less than this many seconds remain
const REFRESH_THRESHOLD_SECONDS = 60

OpenAPI.BASE = z.string().parse(ONE_CLICK_URL)
OpenAPI.HEADERS = {
  "x-api-key": z.string().parse(ONE_CLICK_API_KEY),
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
      refresh_token: refreshToken,
    })
    return {
      accessToken: response.access_token,
      expiresIn: response.expires_in,
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
 * Helper to set OpenAPI headers with authorization
 */
function setAuthHeaders(accessToken: string) {
  OpenAPI.HEADERS = {
    "x-api-key": z.string().parse(ONE_CLICK_API_KEY),
    authorization: `Bearer ${accessToken}`,
  }
}

/**
 * Helper to reset OpenAPI headers to default
 */
function resetHeaders() {
  OpenAPI.HEADERS = {
    "x-api-key": z.string().parse(ONE_CLICK_API_KEY),
  }
}

/**
 * Authenticate user with signed data and set HTTP-only cookies
 */
export async function authenticatePrivateIntents(args: {
  signedData: Record<string, unknown>
}): Promise<{ ok: { authenticated: true } } | { err: string }> {
  try {
    const response = await UserAuthService.authenticate({
      signed_data: args.signedData,
    })

    // Save both access and refresh tokens
    await saveSessionTokens(
      response.access_token,
      response.refresh_token,
      response.expires_in,
      response.refresh_expires_in
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
}): Promise<{ ok: GetBalanceResponseDto } | { err: string }> {
  const accessToken = await getValidAccessToken()
  if (!accessToken) {
    return { err: "Not authenticated. Please authenticate first." }
  }

  setAuthHeaders(accessToken)

  try {
    const response = await UserAuthService.getBalance(args?.tokenIds)
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
  } finally {
    resetHeaders()
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
 * Get quote for shielding tokens (public INTENTS → private PRIVATE_INTENTS)
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
      recipientType: QuoteRequest.recipientType.PRIVATE_INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.INTENTS,
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
 * Get quote for unshielding tokens (private PRIVATE_INTENTS → public INTENTS)
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

  setAuthHeaders(accessToken)

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
      depositType: QuoteRequest.depositType.PRIVATE_INTENTS,
      recipientType: QuoteRequest.recipientType.INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.INTENTS,
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
  } finally {
    resetHeaders()
  }
}

const generateShieldIntentArgsSchema = z.object({
  depositAddress: z.string(),
  signerId: z.string(),
  standard: z.nativeEnum(IntentStandardEnum),
})

/**
 * Generate intent for shield/unshield operation
 */
export async function generateShieldIntent(
  args: z.infer<typeof generateShieldIntentArgsSchema>
) {
  const parseResult = generateShieldIntentArgsSchema.safeParse(args)
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
    logger.error(`privateIntents: generateShieldIntent error: ${err}`)
    return { err }
  }
}

/**
 * Submit signed intent for shield/unshield
 */
export async function submitShieldIntent(args: { signedIntent: MultiPayload }) {
  try {
    const response = await OneClickService.submitIntent({
      type: SubmitSwapTransferIntentRequest.type.SWAP_TRANSFER,
      signedIntent: args.signedIntent,
    })
    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: submitShieldIntent error: ${err}`)
    return { err }
  }
}

/**
 * Get execution status for shield/unshield operation
 */
export async function getShieldExecutionStatus(depositAddress: string) {
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
