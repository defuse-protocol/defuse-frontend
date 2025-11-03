import { config, utils } from "@defuse-protocol/internal-utils"
import { nearClient } from "@src/components/DefuseSDK/constants/nearClient"
import { isBannedNearAddress } from "@src/utils/bannedNearAddress"
import * as v from "valibot"

export const dynamic = "force-static"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ address: string }> }
) {
  const { address } = await params

  const isPredecessorIdEnabled = await utils.queryContract({
    nearClient,
    contractId: config.env.contractID,
    methodName: "is_auth_by_predecessor_id_enabled",
    args: {
      account_id: address.toLowerCase(), // normalized address
    },
    schema: v.boolean(),
  })

  // TODO: isBannedNearAddress check might be removed once the blacklist is added to the protocol
  const isFakeEVM = isBannedNearAddress(address)

  return Response.json({
    safetyStatus: isPredecessorIdEnabled && !isFakeEVM ? "safe" : "unsafe",
  })
}
