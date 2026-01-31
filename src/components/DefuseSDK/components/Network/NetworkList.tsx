import { InformationCircleIcon } from "@heroicons/react/16/solid"
import type { NetworkOptions } from "@src/components/DefuseSDK/hooks/useNetworkLists"
import clsx from "clsx"
import type { ReactNode } from "react"
import {
  type NetworkOption,
  isIntentsOption,
} from "../../constants/blockchains"
import type { SupportedChainName } from "../../types/base"
import {
  isValidBlockchainEnumKey,
  reverseAssetNetworkAdapter,
} from "../../utils/adapters"
import { isAuroraVirtualChain } from "../../utils/blockchain"
import { PoweredByAuroraLabel } from "../PoweredByAuroraLabel"
import TooltipNew from "../TooltipNew"

interface NetworkListProps {
  title?: string
  additionalInfo?: string
  networkOptions: NetworkOptions
  selectedNetwork: SupportedChainName | "near_intents" | null
  onChangeNetwork: (network: SupportedChainName | "near_intents") => void
  disabled?: boolean
  renderValueDetails?: (address: string) => ReactNode
  /** Optional separate callback for Near Intents selection. If provided, this is called instead of onChangeNetwork */
  onIntentsSelect?: () => void
}

export const NetworkList = ({
  title,
  additionalInfo,
  networkOptions,
  selectedNetwork,
  onChangeNetwork,
  disabled = false,
  renderValueDetails,
  onIntentsSelect,
}: NetworkListProps) => {
  // Find the Near Intents option if present
  const intentsEntry = Object.entries(networkOptions).find(([_, info]) =>
    isIntentsOption(info)
  )
  const intentsOption = intentsEntry?.[1]

  // Get regular blockchain networks (excluding intents)
  const blockchainNetworks = Object.entries(networkOptions).filter(
    ([_, info]) => info && !isIntentsOption(info)
  )

  return (
    <div>
      {/* Near Intents option - shown above the title */}
      {intentsOption && isIntentsOption(intentsOption) && (
        <div className="flex flex-col gap-1 mb-4">
          <NetworkItem
            {...intentsOption}
            selected={selectedNetwork === "near_intents"}
            disabled={disabled}
            onClick={() =>
              onIntentsSelect
                ? onIntentsSelect()
                : onChangeNetwork("near_intents")
            }
            isAuroraVirtualChain={false}
            renderValueDetails={() => (
              <span className="inline-flex items-center gap-x-1.5 rounded-lg bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                <span className="size-1.5 rounded-full bg-green-500 shrink-0" />
                Internal
              </span>
            )}
          />
        </div>
      )}

      {/* Title and regular networks */}
      <div className="flex items-center gap-2">
        {title && (
          <h3 className="text-gray-500 text-sm/6 font-medium">{title}</h3>
        )}

        {additionalInfo && (
          <TooltipNew>
            <TooltipNew.Trigger>
              <button
                type="button"
                className="flex items-center justify-center size-6 rounded-lg shrink-0 text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                aria-label={additionalInfo}
              >
                <InformationCircleIcon className="size-4" />
              </button>
            </TooltipNew.Trigger>
            <TooltipNew.Content
              side="bottom"
              className="max-w-56 text-center text-balance"
            >
              {additionalInfo}
            </TooltipNew.Content>
          </TooltipNew>
        )}
      </div>

      <div className="mt-2 flex flex-col gap-1">
        {blockchainNetworks.map(([network, networkInfo]) => {
          if (!networkInfo) return null

          if (!isValidBlockchainEnumKey(network)) {
            return null
          }
          const networkName = reverseAssetNetworkAdapter[network]

          return (
            <NetworkItem
              key={networkInfo.value}
              {...networkInfo}
              selected={selectedNetwork === networkName}
              disabled={disabled}
              onClick={() => onChangeNetwork(networkName)}
              isAuroraVirtualChain={isAuroraVirtualChain(networkName)}
              renderValueDetails={renderValueDetails}
            />
          )
        })}
      </div>
    </div>
  )
}

const NetworkItem = ({
  icon,
  label,
  value,
  selected,
  disabled,
  onClick,
  isAuroraVirtualChain,
  renderValueDetails,
}: NetworkOption & {
  selected: boolean
  disabled: boolean
  onClick: () => void
  isAuroraVirtualChain?: boolean
  renderValueDetails?: (address: string) => ReactNode
}) => (
  <div
    className={clsx(
      "relative flex items-center gap-3 py-3 -mx-4 px-4 rounded-2xl hover:bg-gray-100",
      {
        "bg-gray-100": selected,
        "opacity-50 pointer-events-none": disabled,
      }
    )}
  >
    <div className="flex items-center gap-3 flex-1">
      {icon}
      <div className="text-base/none font-semibold text-gray-900">{label}</div>
    </div>

    {onClick && !disabled && (
      <button
        type="button"
        onClick={onClick}
        className="absolute z-10 inset-0 rounded-2xl"
        aria-label="Select network"
      />
    )}

    {renderValueDetails?.(value) && (
      <div className="flex items-center gap-3">{renderValueDetails(value)}</div>
    )}

    {isAuroraVirtualChain && <PoweredByAuroraLabel />}
  </div>
)
