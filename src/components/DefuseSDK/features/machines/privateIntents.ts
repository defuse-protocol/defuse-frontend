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

// Cookie name for private intents session
const PRIVATE_INTENTS_COOKIE = "private_intents_session"
const COOKIE_MAX_AGE = 60 * 60 * 24 // 24 hours

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
 * Helper to get access token from HTTP-only cookie
 */
async function getAccessTokenFromCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(PRIVATE_INTENTS_COOKIE)
  return cookie?.value ?? null
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
 * Authenticate user with signed data and set HTTP-only cookie
 */
export async function authenticatePrivateIntents(args: {
  signedData: Record<string, unknown>
}): Promise<{ ok: { authenticated: true } } | { err: string }> {
  try {
    const response = await UserAuthService.authenticate({
      signed_data: args.signedData,
    })

    // Set HTTP-only cookie with access token
    const cookieStore = await cookies()
    cookieStore.set(PRIVATE_INTENTS_COOKIE, response.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: COOKIE_MAX_AGE,
      path: "/",
    })

    return { ok: { authenticated: true } }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`privateIntents: authenticate error: ${err}`)
    return { err }
  }
}

/**
 * Check if user is authenticated (has valid session cookie)
 */
export async function isPrivateIntentsAuthenticated(): Promise<boolean> {
  const token = await getAccessTokenFromCookie()
  return token !== null
}

/**
 * Logout - remove the session cookie
 */
export async function logoutPrivateIntents(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(PRIVATE_INTENTS_COOKIE)
}

/**
 * Get private balance for authenticated user (uses cookie)
 */
export async function getPrivateBalance(args?: {
  tokenIds?: string[]
}): Promise<{ ok: GetBalanceResponseDto } | { err: string }> {
  const accessToken = await getAccessTokenFromCookie()
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
 * Uses session cookie for authorization
 */
export async function getUnshieldQuote(
  args: UnshieldQuoteArgs
): Promise<{ ok: QuoteResponse } | { err: string }> {
  const accessToken = await getAccessTokenFromCookie()
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

type ServerError = z.infer<typeof serverErrorSchema>

function isServerError(error: unknown): error is ServerError {
  return serverErrorSchema.safeParse(error).success
}

function unknownServerErrorToString(error: unknown): string {
  return isServerError(error)
    ? error.body.message
    : error instanceof Error
      ? error.message
      : String(error)
}
