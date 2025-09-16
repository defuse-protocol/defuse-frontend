import { CaretDownIcon } from "@radix-ui/react-icons"
import type React from "react"

import type { BaseTokenInfo, UnifiedTokenInfo } from "../types/base"

import {
  hasChainNameInSymbol,
  removeChainNameFromSymbol,
} from "@src/constants/tokens"
import { chainIcons } from "../constants/blockchains"
import { isBaseToken } from "../utils"
import { AssetComboIcon } from "./Asset/AssetComboIcon"

type Props = {
  selected?: BaseTokenInfo | UnifiedTokenInfo
  handleSelect?: () => void
}

const EmptyIcon = () => {
  return (
    <span className="relative min-w-[36px] min-h-[36px] bg-gray-200 rounded-full" />
  )
}

export const SelectAssets = ({ selected, handleSelect }: Props) => {
  const handleAssetsSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleSelect?.()
  }

  return (
    <button
      type="button"
      onClick={handleAssetsSelect}
      className="max-w-[148px] md:max-w-[210px] bg-gray-1 shadow-select-token rounded-full flex justify-between items-center p-1 gap-2.5 dark:shadow-select-token-dark"
    >
      {selected?.icon ? (
        <AssetComboIcon
          icon={selected.icon as string}
          name={selected.name as string}
          chainName={isBaseToken(selected) ? selected.chainName : undefined}
          chainIcon={
            isBaseToken(selected) ? chainIcons[selected.chainName] : undefined
          }
          showChainIcon={hasChainNameInSymbol(selected)}
        />
      ) : (
        <EmptyIcon />
      )}
      <span className="text-sm uppercase truncate">
        {selected?.symbol
          ? removeChainNameFromSymbol(selected.symbol)
          : "select token"}
      </span>
      <CaretDownIcon width={25} height={25} />
    </button>
  )
}
