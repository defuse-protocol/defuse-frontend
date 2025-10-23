import { Text } from "@radix-ui/themes"
import type { NetworkOptions } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import clsx from "clsx"
import type { ReactNode } from "react"
import { isIntentsOption } from "../../constants/blockchains"
import type { SupportedChainName } from "../../types/base"
import {
  isValidBlockchainEnumKey,
  reverseAssetNetworkAdapter,
} from "../../utils/adapters"
import { isAuroraVirtualChain } from "../../utils/blockchain"
import { PoweredByAuroraLabel } from "../PoweredByAuroraLabel"

interface NetworkListProps {
  networkOptions: NetworkOptions
  selectedNetwork: SupportedChainName | "near_intents" | null
  onChangeNetwork: (network: SupportedChainName) => void
  disabled?: boolean
  renderValueDetails?: (address: string) => ReactNode
  onIntentsSelect?: () => void
}

export const NetworkList = ({
  networkOptions,
  selectedNetwork,
  onChangeNetwork,
  disabled = false,
  renderValueDetails,
  onIntentsSelect,
}: NetworkListProps) => {
  return (
    <div
      className={clsx("flex flex-col gap-2", {
        "opacity-50 pointer-events-none": disabled,
      })}
      data-testid="network-list"
    >
      {Object.keys(networkOptions).map((network) => {
        const networkInfo = networkOptions[network]
        if (!networkInfo) return null

        // Special case: Handle Intents internal transfers which exist outside the standard blockchain options.
        if (isIntentsOption(networkInfo)) {
          return (
            <button
              key={networkInfo.value}
              type="button"
              className={clsx(
                "flex justify-between items-center gap-3 p-2.5 rounded-md hover:bg-gray-3",
                {
                  "bg-gray-3": selectedNetwork === "near_intents",
                }
              )}
              onClick={onIntentsSelect}
            >
              <div className="flex items-center gap-2">
                {networkInfo.icon}
                <Text as="span" size="3" weight="bold">
                  {networkInfo.label}
                </Text>
              </div>
              <div className="flex items-center py-1 px-2 rounded-full bg-[#E1F9EA] text-[#17A615]">
                <span className="text-xs">internal</span>
              </div>
            </button>
          )
        }

        if (!isValidBlockchainEnumKey(network)) {
          return null
        }
        const networkName = reverseAssetNetworkAdapter[network]

        // Normal case: Render standard blockchain options.
        return (
          <button
            key={networkInfo.value}
            type="button"
            className={clsx(
              "flex justify-between items-center gap-3 p-2.5 rounded-md hover:bg-gray-3",
              {
                "bg-gray-3": selectedNetwork === networkName,
              }
            )}
            onClick={() => onChangeNetwork(networkName)}
          >
            <div className="flex items-center gap-2">
              {networkInfo.icon}
              <Text as="span" size="3" weight="bold">
                {networkInfo.label}
              </Text>
              {isAuroraVirtualChain(networkName) && <PoweredByAuroraLabel />}
            </div>
            <div className="flex items-center gap-2">
              {renderValueDetails?.(networkInfo.value)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
