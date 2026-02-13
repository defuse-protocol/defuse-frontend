import useSearchNetworks from "@src/hooks/useFilterNetworks"
import clsx from "clsx"
import { type ReactNode, useRef, useState } from "react"
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

  const availableNetworkOptions = useSearchNetworks({
    networks: availableNetworks,
    searchValue,
  })

  const disabledNetworkOptions = useSearchNetworks({
    networks: disabledNetworks,
    searchValue,
  })

  const availableNetworksValues = Object.keys(availableNetworkOptions)
  const disabledNetworksValues = Object.keys(disabledNetworkOptions)

  const onChangeNetwork = (network: SupportedChainName) => {
    selectNetwork(network)
    onClose()
  }

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
            isScrolled ? "border-border" : "border-transparent"
          )}
        >
          <SearchBar
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onClear={() => setSearchValue("")}
            placeholder="Search networks"
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
                    networkOptions={availableNetworkOptions}
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
                    networkOptions={disabledNetworkOptions}
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
