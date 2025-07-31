import { X as CrossIcon } from "@phosphor-icons/react"
import { InfoCircledIcon } from "@radix-ui/react-icons"
import { Text } from "@radix-ui/themes"
import { type ReactNode, useMemo, useState } from "react"
import type { NetworkOptions } from "../../hooks/useNetworkLists"
import type { SupportedChainName } from "../../types/base"
import { filterChains } from "../../utils/blockchain"
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

  const filteredAvailableNetworks = useMemo(() => {
    return filterChains(availableNetworks, searchValue)
  }, [availableNetworks, searchValue])

  const filteredDisabledNetworks = useMemo(() => {
    return filterChains(disabledNetworks, searchValue)
  }, [disabledNetworks, searchValue])

  const onChangeNetwork = (network: SupportedChainName) => {
    selectNetwork(network)
    onClose()
  }

  const availableNetworksValues = Object.keys(filteredAvailableNetworks)
  const disabledNetworksValues = Object.keys(filteredDisabledNetworks)

  return (
    <BaseModalDialog open={!!isOpen} onClose={onClose} isDismissable>
      <div className="flex flex-col min-h-[680px] md:max-h-[680px] h-full">
        <div className="z-20 h-auto flex-none -mt-[var(--inset-padding-top)] -mr-[var(--inset-padding-right)] -ml-[var(--inset-padding-left)] px-5 pt-7 pb-4 sticky -top-[var(--inset-padding-top)] bg-gray-1">
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

        <div className="z-10 flex-1 overflow-y-auto  -mr-[var(--inset-padding-right)] pr-[var(--inset-padding-right)]">
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
                    networkOptions={filteredAvailableNetworks}
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
                    networkOptions={filteredDisabledNetworks}
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
