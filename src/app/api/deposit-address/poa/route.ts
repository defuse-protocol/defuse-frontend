import { BlockchainEnum, poaBridge } from "@defuse-protocol/internal-utils"
import { getDepositNetworkMemo } from "@src/components/DefuseSDK/services/depositService"
import type { ErrorResponse } from "@src/features/gift/types/giftTypes"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import { z } from "zod"

const requestSchema = z.object({
  accountId: z.string(),
  blockchain: z.nativeEnum(BlockchainEnum),
})

export type GetPOADepositAddressResponse = {
  generatedDepositAddress: string | null
  memo: string | null
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parseResult = requestSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: `Invalid arguments: ${parseResult.error.message}`,
        } satisfies ErrorResponse,
        { status: 400 }
      )
    }

    const { accountId, blockchain } = parseResult.data
    const supportedTokens = await poaBridge.httpClient.getSupportedTokens({
      chains: [blockchain],
    })

    if (supportedTokens.tokens.length === 0) {
      return NextResponse.json(
        { error: "No supported tokens found" } satisfies ErrorResponse,
        { status: 400 }
      )
    }

    const depositMemo = getDepositNetworkMemo(blockchain)
    const result = await poaBridge.httpClient.getDepositAddress({
      account_id: accountId,
      chain: blockchain,
      ...(depositMemo && depositMemo),
    })

    return NextResponse.json(
      {
        generatedDepositAddress: result.address,
        memo: result.memo || null,
      } satisfies GetPOADepositAddressResponse,
      {
        status: 200,
      }
    )
  } catch (error) {
    logger.error("Error generating POA deposit address:", { error })
    return NextResponse.json(
      { error: "Internal server error" } satisfies ErrorResponse,
      { status: 500 }
    )
  }
}
