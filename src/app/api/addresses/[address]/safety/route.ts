import { config, utils } from "@defuse-protocol/internal-utils"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { isBannedNearAddress } from "@src/utils/bannedNearAddress"
import { logger } from "@src/utils/logger"
import { NextResponse } from "next/server"
import * as v from "valibot"

export const dynamic = "force-dynamic"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const { address } = await params
    const normalizedAddress = address.toLowerCase()

    await nearClient.status()
    const isPredecessorIdEnabled = await utils.queryContract({
      nearClient,
      contractId: config.env.contractID,
      methodName: "is_auth_by_predecessor_id_enabled",
      args: {
        account_id: normalizedAddress,
      },
      schema: v.boolean(),
    })

    // TODO: isBannedNearAddress check might be removed once the blacklist is added to the protocol
    const isFakeEVM = isBannedNearAddress(normalizedAddress)

    return NextResponse.json({
      safetyStatus: isPredecessorIdEnabled && !isFakeEVM ? "safe" : "unsafe",
    })
  } catch (error) {
    logger.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
