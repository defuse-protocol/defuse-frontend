import Image from "next/image"
import React from "react"

import { NetworkToken } from "@/types/interfaces"
import AssetComboIcon from "@/components/Network/AssetComboIcon"

type Props = {
  selected?: NetworkToken
  handleSelect?: () => void
}

const EmptyIcon = () => {
  return (
    <span className="relative w-[36px] h-[36px] bg-gray-400 rounded-full"></span>
  )
}

const SelectAssets = ({ selected, handleSelect }: Props) => {
  const handleAssetsSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleSelect && handleSelect()
  }
  return (
    <button
      onClick={handleAssetsSelect}
      className="max-w-[210px] bg-white shadow-select-token rounded-full flex justify-between items-center p-1 gap-2.5"
    >
      {selected ? (
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
      <Image
        src="/static/icons/caret-down.svg"
        width={25}
        height={25}
        alt="caret-down"
      />
    </button>
  )
}

export default SelectAssets