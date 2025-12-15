import { tokens } from "@src/components/DefuseSDK/sdk/tokensUsdPricesHttpClient"
import type { TokenUsdPriceInfo } from "@src/components/DefuseSDK/sdk/tokensUsdPricesHttpClient/types"
import { useQuery } from "@tanstack/react-query"

export const tokensUsdPricesQueryKey = ["tokens-usd-prices"]
export type TokenUsdPriceData = Record<
  TokenUsdPriceInfo["defuse_asset_id"],
  TokenUsdPriceInfo
>
export async function tokensPriceDataInUsd(): Promise<TokenUsdPriceData> {
  const data = await tokens()
  const result: TokenUsdPriceData = {}
  for (const token of data.items) {
    result[token.defuse_asset_id] = token
  }
  return result
}

export const useTokensUsdPrices = () =>
  useQuery({
    queryKey: tokensUsdPricesQueryKey,
    queryFn: tokensPriceDataInUsd,
    refetchInterval: 20_000,
  })

export function createTokenUsdPricesQueryOptions() {
  return {
    queryKey: tokensUsdPricesQueryKey,
    queryFn: tokensPriceDataInUsd,
    refetchInterval: 20_000,
  }
}
