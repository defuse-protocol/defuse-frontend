import type {} from "@src/components/DefuseSDK/types"
import type { TokenWithTags } from "@src/constants/tokens"
import { useFlatTokenList } from "@src/hooks/useFlatTokenList"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"

export function useTokenList(tokenList: TokenWithTags[]) {
  const flatTokenList = useFlatTokenList(tokenList)
  const searchParams = useSearchParams()

  const sortedList = useMemo(
    () => sortTokensByMarketCap(flatTokenList),
    [flatTokenList]
  )

  /**
   * Enable tokens with `feature:${string}` tag depended on URL search params.
   * E.g. /?ada=1 will enable tokens with a tag "feature:ada"
   */
  return useMemo(() => {
    const filteredList = sortedList.filter((token) => {
      const feature = token.tags?.find((tag) => tag.startsWith("feature:"))
      if (feature == null) {
        return true
      }
      return searchParams.has(feature.split(":")[1])
    })

    if (searchParams.get("fms")) {
      filteredList.push({
        defuseAssetId:
          "nep141:base-0xa5c67d8d37b88c2d88647814da5578128e2c93b2.omft.near",
        address: "0xa5c67d8d37b88c2d88647814da5578128e2c93b2",
        decimals: 18,
        icon: "/static/icons/icon-fms.svg",
        chainName: "base",
        bridge: "poa",
        symbol: "FMS",
        name: "FOMO SOLVER",
      })
    }

    return filteredList
  }, [searchParams, sortedList])
}

function compareTokens(a: TokenWithTags, b: TokenWithTags): number {
  const aTags = a.tags ?? []
  const bTags = b.tags ?? []

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

function sortTokensByMarketCap(tokens: TokenWithTags[]) {
  return Array.from(tokens).sort(compareTokens)
}
