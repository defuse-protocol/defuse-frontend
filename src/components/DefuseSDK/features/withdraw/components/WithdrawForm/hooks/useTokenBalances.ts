import { useTokenBalancesQuery } from "../../../../../queries/poaBridgeQueries"
import type { TokenValue } from "../../../../../types/base"
import type { SwappableToken } from "../../../../../types/swap"
import { tokenAccountIdToDefuseAssetId } from "../../../../../utils/tokenUtils"

export const useTokenBalances = (
  token: SwappableToken,
  hasAnyBalance: boolean
): Record<string, TokenValue> => {
  const { data } = useTokenBalancesQuery(token, hasAnyBalance)

  const balances: Record<string, TokenValue> = {}
  if (data) {
    for (const balance of data) {
      balances[tokenAccountIdToDefuseAssetId(balance.nearAddress)] = {
        amount: BigInt(balance.vaultBalance),
        decimals: balance.decimals,
      }
    }
  }

  return balances
}
