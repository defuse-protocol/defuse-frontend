import type { providers } from "near-api-js"
import type { BlockId } from "near-api-js/lib/providers/provider"
import type { BaseTokenInfo } from "../types/base"
import type { IntentsUserId } from "../types/intentsUserId"
import { batchBalanceOf } from "./intentsContractService"

export type TokenBalances = Record<BaseTokenInfo["defuseAssetId"], bigint>

export async function getDepositedBalances(
  accountId: IntentsUserId,
  tokenIds: BaseTokenInfo["defuseAssetId"][],
  nearClient: providers.Provider,
  blockId?: BlockId
): Promise<TokenBalances> {
  const amounts = await batchBalanceOf({
    nearClient,
    accountId,
    tokenIds,
    blockId,
  })

  // Transforming response
  const result: TokenBalances = {}
  for (let i = 0; i < tokenIds.length; i++) {
    // biome-ignore lint/style/noNonNullAssertion: always within bounds
    result[tokenIds[i]!] = BigInt(amounts[i]!)
  }

  return result
}
