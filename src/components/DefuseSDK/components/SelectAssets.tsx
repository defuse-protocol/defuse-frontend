import { CaretDownIcon } from "@radix-ui/react-icons"
import type React from "react"

import { hasChainIcon } from "@src/app/(home)/_utils/useDeterminePair"
import { useMemo } from "react"
import { chainIcons } from "../constants/blockchains"
import type { TokenInfo } from "../types/base"
import { isBaseToken } from "../utils"
import { AssetComboIcon } from "./Asset/AssetComboIcon"

type Props = {
  selected?: TokenInfo
  handleSelect?: () => void
  tokens?: TokenInfo[]
  tokenIn?: TokenInfo
  tokenOut?: TokenInfo
}

const EmptyIcon = () => {
  return (
    <span className="relative min-w-[36px] min-h-[36px] bg-gray-200 rounded-full" />
  )
}

export const SelectAssets = ({
  selected,
  handleSelect,
  tokens,
  tokenIn,
  tokenOut,
}: Props) => {
  const handleAssetsSelect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    handleSelect?.()
  }

  const chainIcon = useMemo(() => {
    return selected !== undefined && isBaseToken(selected)
      ? chainIcons[selected.chainName]
      : undefined
  }, [selected])

  const showChainIcon = useMemo(() => {
    if (
      chainIcon === undefined ||
      tokens === undefined ||
      selected === undefined
    ) {
      return false
    }

    const allTokens = [...tokens]

    if (tokenIn !== undefined) {
      allTokens.push(tokenIn)
    }

    if (tokenOut !== undefined) {
      allTokens.push(tokenOut)
    }

    return hasChainIcon(selected, allTokens)
  }, [tokens, tokenIn, tokenOut, selected, chainIcon])

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
          chainIcon={chainIcon}
          showChainIcon={showChainIcon}
        />
      ) : (
        <EmptyIcon />
      )}
      <span className="text-sm uppercase truncate">
        {selected?.symbol ?? "select token"}
      </span>
      <CaretDownIcon width={25} height={25} />
    </button>
  )
}
