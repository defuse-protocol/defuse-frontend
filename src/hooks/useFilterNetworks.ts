import type { NetworkOption } from "@src/components/DefuseSDK/constants/blockchains"
import type { NetworkOptions } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import { performSearch } from "@src/utils/smartSearch"
import { useMemo } from "react"

type SearchableNetwork = {
  networkOption: NetworkOption
  key: string
  searchData: {
    nameLower: string
  }
}

const filterNetworksWithSearch = (
  networks: SearchableNetwork[],
  searchValue: string,
  options: {
    maxFuzzyDistance?: number
    maxResults?: number
  } = {}
): SearchableNetwork[] => {
  if (!searchValue.trim()) return networks

  const { maxFuzzyDistance = 1, maxResults = 50 } = options
  const { results } = performSearch(networks, searchValue, {
    maxFuzzyDistance,
    maxResults,
  })

  return results
}

const useSearchNetworks = ({
  networks,
  searchValue,
}: {
  networks: NetworkOptions
  searchValue: string
}) =>
  useMemo(() => {
    const searchableNetworks: SearchableNetwork[] = Object.entries(
      networks
    ).map(([key, networkOption]) => ({
      key,
      networkOption,
      searchData: { nameLower: networkOption.label.toLowerCase() },
    }))

    const filtered = filterNetworksWithSearch(searchableNetworks, searchValue)

    return Object.fromEntries(
      filtered.map((item) => [item.key, item.networkOption])
    )
  }, [networks, searchValue])

export default useSearchNetworks
