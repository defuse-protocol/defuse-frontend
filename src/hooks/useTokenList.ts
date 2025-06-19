import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@defuse-protocol/defuse-sdk/types"

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
        chainName: "base",
        bridge: "poa",
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

  // Sort by trade volume first
  const aVolume = getVolumeOrder(aTags)
  const bVolume = getVolumeOrder(bTags)

  if (aVolume !== undefined && bVolume !== undefined) {
    return aVolume - bVolume
  }

  if (aVolume !== undefined) return -1
  if (bVolume !== undefined) return 1

  // Then sort by stablecoins
  const aIsStable = aTags.some((tag) => tag === "type:stablecoin")
  const bIsStable = bTags.some((tag) => tag === "type:stablecoin")

  if (aIsStable && !bIsStable) return -1
  if (!aIsStable && bIsStable) return 1

  // Finally sort by market cap
  const aMarketCap = getMarketCapOrder(aTags)
  const bMarketCap = getMarketCapOrder(bTags)

  if (aMarketCap !== undefined && bMarketCap !== undefined) {
    return aMarketCap - bMarketCap
  }
  if (aMarketCap !== undefined) return -1
  if (bMarketCap !== undefined) return 1

  return 0
}

function getMarketCapOrder(tags: string[]): number | undefined {
  const mcTag = tags.find((tag) => tag.startsWith("mc:"))
  if (!mcTag) return undefined
  return Number.parseInt(mcTag.split(":")[1])
}

function getVolumeOrder(tags: string[]): number | undefined {
  const volTag = tags.find((tag) => tag.startsWith("tvol:"))
  if (!volTag) return undefined
  return Number.parseInt(volTag.split(":")[1])
}

function sortTokensByMarketCap(
  tokens: (BaseTokenInfo | UnifiedTokenInfo)[]
): (BaseTokenInfo | UnifiedTokenInfo)[] {
  return Array.from(tokens).sort(compareTokens)
}
