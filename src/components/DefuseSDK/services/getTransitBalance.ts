import { poaBridge } from "@defuse-protocol/internal-utils"
import type { BaseTokenInfo } from "../types/base"
import type { IntentsUserId } from "../types/intentsUserId"
import { tokenAccountIdToDefuseAssetId } from "../utils/tokenUtils"

type TokenBalances = Record<BaseTokenInfo["defuseAssetId"], bigint>

export async function getTransitBalance(accountId: IntentsUserId) {
  const pendingDeposits: TokenBalances = {}

  for (const deposit of await poaBridge.getPendingDeposits(accountId)) {
    // POA bridge returns token IDs without the 'nep141:' prefix (e.g. 'base.omft.near')
    const defuseAssetId = tokenAccountIdToDefuseAssetId(deposit.near_token_id)
    pendingDeposits[defuseAssetId] = BigInt(deposit.amount)
  }

  return pendingDeposits
}
