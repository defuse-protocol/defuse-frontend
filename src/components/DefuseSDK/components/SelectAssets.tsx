"use client"
import { CaretDownIcon } from "@radix-ui/react-icons"
import type React from "react"

import { hasChainIcon } from "@src/app/(home)/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
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
      ? chainIcons[selected.originChainName]
      : undefined
  }, [selected])

  const isFlatTokenListEnabled = useIsFlatTokenListEnabled()

  const showChainIcon = useMemo(() => {
    if (isFlatTokenListEnabled && chainIcon !== undefined) {
      return true
    }

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
  }, [tokens, tokenIn, tokenOut, selected, chainIcon, isFlatTokenListEnabled])

  return (
    <button
      type="button"
      onClick={handleAssetsSelect}
      className="max-w-[120px] sm:max-w-[148px] md:max-w-[210px] bg-gray-1 shadow-select-token rounded-full flex justify-between items-center p-1 gap-1.5 md:gap-2.5 dark:shadow-select-token-dark min-w-0"
    >
      {selected?.icon ? (
        <AssetComboIcon
          icon={selected.icon as string}
          name={selected.name as string}
          chainName={
            isBaseToken(selected) ? selected.originChainName : undefined
          }
          chainIcon={chainIcon}
          showChainIcon={showChainIcon}
        />
      ) : (
        <EmptyIcon />
      )}
      <span className="text-xs sm:text-sm uppercase truncate min-w-0">
        {selected?.symbol ?? "select token"}
      </span>
      <CaretDownIcon width={25} height={25} />
    </button>
  )
}
