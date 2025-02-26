import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk"

import { useFlatTokenList } from "@src/hooks/useFlatTokenList"
import { useSearchParams } from "next/navigation"

export function useTokenList(tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]) {
  let list = useFlatTokenList(tokenList)
  const searchParams = useSearchParams()

  list = sortTokensByMarketCap(list)

  if (searchParams.get("fms")) {
    list = [
      ...list,
      {
        defuseAssetId:
          "nep141:base-0xa5c67d8d37b88c2d88647814da5578128e2c93b2.omft.near",
        address: "0xa5c67d8d37b88c2d88647814da5578128e2c93b2",
        decimals: 18,
        icon: "/static/icons/icon-fms.svg",
        chainId: "",
        chainIcon: "/static/icons/network/base.svg",
        chainName: "base",
        routes: [],
        symbol: "FMS",
        name: "FOMO SOLVER",
      },
    ]
  }

  return list
}

function compareTokens(
  a: BaseTokenInfo | UnifiedTokenInfo,
  b: BaseTokenInfo | UnifiedTokenInfo
): number {
  const aTags = (a as { tags?: string[] }).tags || []
  const bTags = (b as { tags?: string[] }).tags || []

  const aIsStable = aTags.some((tag) => tag === "type:stablecoin")
  const bIsStable = bTags.some((tag) => tag === "type:stablecoin")

  // Sort stablecoins first
  if (aIsStable && !bIsStable) return -1
  if (!aIsStable && bIsStable) return 1

  const aMarketCap = getMarketCapOrder(aTags)
  const bMarketCap = getMarketCapOrder(bTags)

  // Sort by market cap if both have it
  if (aMarketCap !== undefined && bMarketCap !== undefined) {
    return aMarketCap - bMarketCap
  }

  // Put tokens with market cap before those without
  if (aMarketCap !== undefined) return -1
  if (bMarketCap !== undefined) return 1

  return 0
}

function getMarketCapOrder(tags: string[]): number | undefined {
  const mcTag = tags.find((tag) => tag.startsWith("mc:"))
  if (!mcTag) return undefined
  return Number.parseInt(mcTag.split(":")[1])
}

function sortTokensByMarketCap(
  tokens: (BaseTokenInfo | UnifiedTokenInfo)[]
): (BaseTokenInfo | UnifiedTokenInfo)[] {
  return Array.from(tokens).sort(compareTokens)
}
