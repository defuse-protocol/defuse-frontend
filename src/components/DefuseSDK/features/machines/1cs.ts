"use server"

import { type AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import {
  type GenerateIntentResponse,
  GenerateSwapTransferIntentRequest,
  IntentStandardEnum,
  type MultiPayload,
  OneClickService,
  OpenAPI,
  QuoteRequest,
  type QuoteResponse,
  type SubmitIntentResponse,
  SubmitSwapTransferIntentRequest,
} from "@defuse-protocol/one-click-sdk-typescript"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import { getTokenByAssetId } from "@src/components/DefuseSDK/utils/tokenUtils"
import { whitelabelTemplateFlag } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { referralMap } from "@src/hooks/useIntentsReferral"
import { APP_FEE_BPS, ONE_CLICK_URL } from "@src/utils/environment"
import { getAppFeeRecipients } from "@src/utils/getAppFeeRecipient"
import { logger } from "@src/utils/logger"
import { splitAppFeeBps } from "@src/utils/splitAppFee"
import { unstable_cache } from "next/cache"
import z from "zod"

OpenAPI.BASE = z.string().parse(ONE_CLICK_URL)

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

const swapTypeSchema = z.nativeEnum(QuoteRequest.swapType)

const getQuoteArgsSchema = z.object({
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

type GetQuoteArgs = z.infer<typeof getQuoteArgsSchema>

export async function getQuote(
  args: GetQuoteArgs
): Promise<
  | { ok: QuoteResponse & { appFee: [string, bigint][] } }
  | { err: string; originalRequest?: QuoteRequest | undefined }
> {
  const parseResult = getQuoteArgsSchema.safeParse(args)
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
      depositType: QuoteRequest.depositType.INTENTS,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.INTENTS,
      recipient: intentsUserId,
      recipientType: QuoteRequest.recipientType.INTENTS,
      quoteWaitingTimeMs: 0, // means the fastest quote
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
    logger.error(`1cs: getQuote error: ${err}`)
    return { err, originalRequest: req }
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

const getTxStatusArgSchema = z.string()
type GetTxStatusArg = z.infer<typeof getTxStatusArgSchema>

export async function getTxStatus(arg: GetTxStatusArg) {
  const depositAddress = getTxStatusArgSchema.safeParse(arg)
  if (!depositAddress.success) {
    return { err: `Invalid argument: ${depositAddress.error.message}` }
  }

  try {
    return { ok: await OneClickService.getExecutionStatus(depositAddress.data) }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`1cs: getTxStatus error: ${err}`)
    return { err }
  }
}

const submitTxHashArgSchema = z.object({
  depositAddress: z.string(),
  txHash: z.string(),
})

type SubmitTxHashArg = z.infer<typeof submitTxHashArgSchema>

export async function submitTxHash(args: SubmitTxHashArg) {
  const body = submitTxHashArgSchema.safeParse(args)
  if (!body.success) {
    return { err: `Invalid argument: ${body.error.message}` }
  }

  try {
    return {
      ok: await OneClickService.submitDepositTx({
        ...body.data,
        // @ts-expect-error not documented feature
        type: "INTENTS",
      }),
    }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`1cs: submitTxHash error: ${err}`)
    return { err }
  }
}

function unknownServerErrorToString(error: unknown): string {
  return isServerError(error)
    ? error.body.message
    : error instanceof Error
      ? error.message
      : String(error)
}

const intentStandardEnumSchema = z.nativeEnum(IntentStandardEnum)

const generateIntentArgsSchema = z.object({
  depositAddress: z.string(),
  signerId: z.string(),
  standard: intentStandardEnumSchema,
})

type GenerateIntentArgs = z.infer<typeof generateIntentArgsSchema>

export async function generateIntent(
  args: GenerateIntentArgs
): Promise<{ ok: GenerateIntentResponse } | { err: string }> {
  const parseResult = generateIntentArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  const { depositAddress, signerId, standard } = parseResult.data

  try {
    const response = await OneClickService.generateIntent({
      type: GenerateSwapTransferIntentRequest.type.SWAP_TRANSFER,
      standard,
      depositAddress,
      signerId,
    })

    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`1cs: generateIntent error: ${err}`)
    return { err }
  }
}

// Schema for MultiPayload - this is a union type that can be any of the supported payload formats
// We use z.any() here because the actual validation is done by the SDK
const multiPayloadSchema = z
  .object({
    standard: z.string(),
    payload: z.any(),
    signature: z.any().optional(),
    public_key: z.string().optional(),
  })
  .passthrough()

const submitIntentArgsSchema = z.object({
  signedIntent: multiPayloadSchema,
})

type SubmitIntentArgs = {
  signedIntent: MultiPayload
}

export async function submitIntent(
  args: SubmitIntentArgs
): Promise<{ ok: SubmitIntentResponse } | { err: string }> {
  const parseResult = submitIntentArgsSchema.safeParse(args)
  if (!parseResult.success) {
    return { err: `Invalid arguments: ${parseResult.error.message}` }
  }

  try {
    const response = await OneClickService.submitIntent({
      type: SubmitSwapTransferIntentRequest.type.SWAP_TRANSFER,
      signedData: args.signedIntent,
    })

    return { ok: response }
  } catch (error) {
    const err = unknownServerErrorToString(error)
    logger.error(`1cs: submitIntent error: ${err}`)
    return { err }
  }
}
