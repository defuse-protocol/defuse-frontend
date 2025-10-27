import { AuthMethod, authIdentity } from "@defuse-protocol/internal-utils"
import {
  OneClickService,
  QuoteRequest,
  type QuoteResponse,
} from "@defuse-protocol/one-click-sdk-typescript"
import { CHAIN_IDS } from "@src/components/DefuseSDK/constants/evm"
import type { BaseTokenInfo } from "@src/components/DefuseSDK/types/base"
import { computeAppFeeBps } from "@src/components/DefuseSDK/utils/appFee"
import type { ErrorResponse } from "@src/features/gift/types/giftTypes"
import { APP_FEE_BPS, APP_FEE_RECIPIENT } from "@src/utils/environment"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const supportedChainNameSchema = z.nativeEnum(
  Object.fromEntries(Object.keys(CHAIN_IDS).map((key) => [key, key]))
)

const baseTokenInfoSchema = z.object({
  defuseAssetId: z.string(),
  symbol: z.string(),
  name: z.string(),
  decimals: z.number(),
  icon: z.string(),
  originChainName: supportedChainNameSchema,
  deployments: z.array(z.any()).min(1), // Simplified to avoid complex union typing
  tags: z.array(z.string()).optional(),
})

export const getDepositAddressArgsSchema = z.object({
  userAddress: z.string(),
  userChainType: z.nativeEnum(AuthMethod),
  chainName: supportedChainNameSchema,
  tokenIn: baseTokenInfoSchema,
  tokenOut: baseTokenInfoSchema,
  amount: z.string(),
})

export type GetOneClickDepositAddressResponse = {
  generatedDepositAddress: string | null
  memo: string | null
  minAmountIn: string | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parseResult = getDepositAddressArgsSchema.safeParse(body)
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: `Invalid arguments: ${parseResult.error.message}`,
        } satisfies ErrorResponse,
        { status: 400 }
      )
    }

    const { userAddress, userChainType, chainName, tokenIn, tokenOut, amount } =
      parseResult.data

    const appFeeBps = computeAppFeeBps(
      APP_FEE_BPS,
      tokenIn as BaseTokenInfo,
      tokenOut as BaseTokenInfo,
      APP_FEE_RECIPIENT,
      { identifier: userAddress, method: userChainType }
    )

    if (appFeeBps > 0 && !APP_FEE_RECIPIENT) {
      return NextResponse.json(
        {
          error: "App fee recipient is not configured",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    const intentsUserId = authIdentity.authHandleToIntentsUserId(
      userAddress,
      userChainType
    )
    const isNetworkRequiresMemo = ["stellar"].includes(chainName)

    const req: QuoteRequest = {
      amount,
      depositMode: isNetworkRequiresMemo
        ? QuoteRequest.depositMode.MEMO
        : QuoteRequest.depositMode.SIMPLE,
      dry: false,
      slippageTolerance: 10000,
      originAsset: tokenIn.defuseAssetId,
      destinationAsset: tokenOut.defuseAssetId,
      depositType: QuoteRequest.depositType.ORIGIN_CHAIN,
      refundTo: intentsUserId,
      refundType: QuoteRequest.refundType.INTENTS,
      recipient: intentsUserId,
      recipientType: QuoteRequest.recipientType.INTENTS,
      swapType: QuoteRequest.swapType.FLEX_INPUT,
      quoteWaitingTimeMs: 0,
      deadline: new Date(Date.now() + 300_000).toISOString(),
      ...(appFeeBps > 0
        ? { appFees: [{ recipient: APP_FEE_RECIPIENT, fee: appFeeBps }] }
        : {}),
    }

    const result: QuoteResponse = await OneClickService.getQuote(req)

    if (!result.quote.depositAddress) {
      return NextResponse.json(
        {
          error: "Generated temporary deposit address is not found",
        } satisfies ErrorResponse,
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        generatedDepositAddress: result.quote.depositAddress,
        memo: result.quote.depositMemo ?? null,
        minAmountIn: result.quote.minAmountIn,
      } satisfies GetOneClickDepositAddressResponse,
      { status: 200 }
    )
  } catch (error) {
    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" } satisfies ErrorResponse,
      { status: 500 }
    )
  }
}
