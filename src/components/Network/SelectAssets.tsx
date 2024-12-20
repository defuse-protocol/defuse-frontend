import { CaretDownIcon } from "@radix-ui/react-icons"
import type React from "react"

import AssetComboIcon from "@src/components/Network/AssetComboIcon"
import type { NetworkToken } from "@src/types/interfaces"

type Props = {
  selected?: NetworkToken
  handleSelect?: () => void
}

const EmptyIcon = () => {
  return (
    <span className="relative min-w-[36px] min-h-[36px] bg-gray-200 rounded-full" />
  )
}

const SelectAssets = ({ selected, handleSelect }: Props) => {
  const handleAssetsSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleSelect?.()
  }
  return (
    <button
      type={"button"}
      onClick={handleAssetsSelect}
      className="max-w-[148px] md:max-w-[210px] bg-white shadow-select-token rounded-full flex justify-between items-center p-1 gap-2.5 dark:bg-black-800 dark:shadow-select-token-dark"
    >
      {selected?.icon ? (
        <AssetComboIcon
          icon={selected?.icon as string}
          name={selected?.name as string}
          chainIcon={selected?.chainIcon as string}
          chainName={selected?.chainName as string}
        />
      ) : (
        <EmptyIcon />
      )}
      <span className="text-sm uppercase truncate">
        {selected?.name || "select token"}
      </span>
      <CaretDownIcon width={25} height={25} />
    </button>
  )
}

export default SelectAssets
