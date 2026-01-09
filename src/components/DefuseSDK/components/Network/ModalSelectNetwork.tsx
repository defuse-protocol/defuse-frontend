import { performSearch } from "@src/utils/smartSearch"
import clsx from "clsx"
import { type ReactNode, useMemo, useRef, useState } from "react"
import type { NetworkOption } from "../../constants/blockchains"
import type { NetworkOptions } from "../../hooks/useNetworkLists"
import type { SupportedChainName } from "../../types/base"
import { BaseModalDialog } from "../Modal/ModalDialog"
import ModalNoResults from "../Modal/ModalNoResults"
import SearchBar from "../SearchBar"
import { NetworkList } from "./NetworkList"

interface ModalSelectNetworkProps {
  selectNetwork: (network: SupportedChainName) => void
  selectedNetwork: SupportedChainName | "near_intents" | null
  isOpen?: boolean
  onClose: () => void
  renderValueDetails?: (address: string) => ReactNode
  availableNetworks: NetworkOptions
  disabledNetworks: NetworkOptions
  onIntentsSelect?: () => void
}

type SearchableNetwork = {
  networkOption: NetworkOption
  key: string
  searchData: {
    nameLower: string
  }
}

export const ModalSelectNetwork = ({
  selectNetwork,
  selectedNetwork,
  isOpen,
  onClose,
  renderValueDetails,
  availableNetworks,
  disabledNetworks,
  onIntentsSelect,
}: ModalSelectNetworkProps) => {
  const [searchValue, setSearchValue] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Create searchable items for available networks
  const searchableAvailableNetworks: SearchableNetwork[] = useMemo(() => {
    return Object.entries(availableNetworks).map(([key, networkOption]) => ({
      key,
      networkOption,
      searchData: {
        nameLower: networkOption.label.toLowerCase(),
      },
    }))
  }, [availableNetworks])

  const searchableDisabledNetworks: SearchableNetwork[] = useMemo(() => {
    return Object.entries(disabledNetworks).map(([key, networkOption]) => ({
      key,
      networkOption,
      searchData: {
        nameLower: networkOption.label.toLowerCase(),
      },
    }))
  }, [disabledNetworks])

  // Filter networks with search
  const filteredAvailableNetworks = useMemo(() => {
    return filterNetworksWithSearch(searchableAvailableNetworks, searchValue)
  }, [searchableAvailableNetworks, searchValue])

  const filteredDisabledNetworks = useMemo(() => {
    return filterNetworksWithSearch(searchableDisabledNetworks, searchValue)
  }, [searchableDisabledNetworks, searchValue])

  // Convert filtered networks to NetworkOptions format
  const availableNetworksOptions = useMemo(() => {
    return Object.fromEntries(
      filteredAvailableNetworks.map((item) => [item.key, item.networkOption])
    )
  }, [filteredAvailableNetworks])

  const disabledNetworksOptions = useMemo(() => {
    return Object.fromEntries(
      filteredDisabledNetworks.map((item) => [item.key, item.networkOption])
    )
  }, [filteredDisabledNetworks])

  const onChangeNetwork = (network: SupportedChainName) => {
    selectNetwork(network)
    onClose()
  }

  const availableNetworksValues = Object.keys(availableNetworksOptions)
  const disabledNetworksValues = Object.keys(disabledNetworksOptions)

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  return (
    <BaseModalDialog
      open={!!isOpen}
      onClose={() => {
        onClose()
        setIsScrolled(false)
      }}
      title="Select network"
    >
      <div className="mt-2 h-[630px] flex flex-col">
        <div
          className={clsx(
            "pb-5 border-b -mx-5 px-5 transition-colors",
            isScrolled ? "border-gray-200" : "border-transparent"
          )}
        >
          <SearchBar
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue("")}
            autoFocus
          />
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto -mx-5 px-5 -mb-5 pb-5"
        >
          <div className="flex flex-col gap-8" data-testid="network-list">
            {[...availableNetworksValues, ...disabledNetworksValues].length ===
            0 ? (
              <ModalNoResults
                text="No networks found"
                handleSearchClear={() => setSearchValue("")}
              />
            ) : (
              <>
                {availableNetworksValues.length > 0 && (
                  <NetworkList
                    title="Available networks"
                    networkOptions={availableNetworksOptions}
                    selectedNetwork={selectedNetwork}
                    onChangeNetwork={onChangeNetwork}
                    renderValueDetails={renderValueDetails}
                    onIntentsSelect={onIntentsSelect}
                  />
                )}
                {disabledNetworksValues.length > 0 && (
                  <NetworkList
                    disabled
                    title="Unsupported networks"
                    additionalInfo="The selected asset is not supported on the following networks."
                    networkOptions={disabledNetworksOptions}
                    selectedNetwork={selectedNetwork}
                    onChangeNetwork={onChangeNetwork}
                    onIntentsSelect={onIntentsSelect}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </BaseModalDialog>
  )
}

function filterNetworksWithSearch(
  networks: SearchableNetwork[],
  searchValue: string,
  options: {
    maxFuzzyDistance?: number
    maxResults?: number
  } = {}
): SearchableNetwork[] {
  if (!searchValue.trim()) {
    return networks
  }
  const { maxFuzzyDistance = 1, maxResults = 50 } = options
  const { results } = performSearch(networks, searchValue, {
    maxFuzzyDistance,
    maxResults,
  })
  return results
}
