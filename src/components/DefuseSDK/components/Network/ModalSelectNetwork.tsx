import { X as CrossIcon } from "@phosphor-icons/react"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Text } from "@radix-ui/themes"
import { performSearch } from "@src/utils/smartSearch"
import { type ReactNode, useMemo, useState } from "react"
import type { NetworkOption } from "../../constants/blockchains"
import type { NetworkOptions } from "../../hooks/useNetworkLists"
import type { SupportedChainName } from "../../types/base"
import { BaseModalDialog } from "../Modal/ModalDialog"
import { ModalNoResults } from "../Modal/ModalNoResults"
import { SearchBar } from "../SearchBar"
import { TooltipInfo } from "../TooltipInfo"
import { NetworkList } from "./NetworksList"

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

  return (
    <BaseModalDialog open={!!isOpen} onClose={onClose} isDismissable>
      <div className="flex flex-col min-h-[680px] md:max-h-[680px] h-full">
        <div className="z-20 h-auto flex-none -mt-(--inset-padding-top) -mr-(--inset-padding-right) -ml-(--inset-padding-left) px-5 pt-7 pb-4 sticky -top-(--inset-padding-top) bg-gray-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <Text size="5" weight="bold">
                Select network
              </Text>
              <button type="button" onClick={onClose} className="p-3">
                <CrossIcon width={18} height={18} />
              </button>
            </div>
            <SearchBar
              placeholder="Search"
              query={searchValue}
              setQuery={setSearchValue}
            />
          </div>
        </div>

        <div className="z-10 flex-1 overflow-y-auto  -mr-(--inset-padding-right) pr-(--inset-padding-right)">
          {[...availableNetworksValues, ...disabledNetworksValues].length ===
          0 ? (
            <ModalNoResults
              text="No networks found"
              handleSearchClear={() => setSearchValue("")}
            />
          ) : (
            <div className="flex flex-col gap-2 divide-y divide-gray-300">
              {availableNetworksValues.length > 0 && (
                <div className="flex flex-col gap-2">
                  <NetworkList
                    networkOptions={availableNetworksOptions}
                    selectedNetwork={selectedNetwork}
                    onChangeNetwork={onChangeNetwork}
                    renderValueDetails={renderValueDetails}
                    onIntentsSelect={onIntentsSelect}
                  />
                </div>
              )}
              {disabledNetworksValues.length > 0 && (
                <div className="flex flex-col gap-2 pt-4">
                  <div className="flex flex-row justify-start items-center gap-2">
                    <Text size="1" weight="bold" className="text-gray-500">
                      Unsupported networks
                    </Text>
                    <TooltipInfo
                      icon={
                        <button type="button">
                          <Text asChild>
                            <InfoCircledIcon />
                          </Text>
                        </button>
                      }
                    >
                      The selected asset is not supported on the following
                      networks.
                    </TooltipInfo>
                  </div>
                  <NetworkList
                    disabled
                    networkOptions={disabledNetworksOptions}
                    selectedNetwork={selectedNetwork}
                    onChangeNetwork={onChangeNetwork}
                    onIntentsSelect={onIntentsSelect}
                  />
                </div>
              )}
            </div>
          )}
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
