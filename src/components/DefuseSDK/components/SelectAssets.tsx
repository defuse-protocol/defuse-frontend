"use client"

import { ChevronDownIcon } from "@heroicons/react/16/solid"
import { hasChainIcon } from "@src/app/(app)/(dashboard)/swap/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import type React from "react"
import { useMemo } from "react"
import { chainIcons } from "../constants/blockchains"
import type { TokenInfo } from "../types/base"
import { isBaseToken } from "../utils"
import AssetComboIcon from "./Asset/AssetComboIcon"

type Props = {
  selected?: TokenInfo
  handleSelect?: () => void
  tokens?: TokenInfo[]
  tokenIn?: TokenInfo
  tokenOut?: TokenInfo
  dataTestId?: string
  disabled?: boolean
}

const SelectAssets = ({
  selected,
  handleSelect,
  tokens,
  tokenIn,
  tokenOut,
  dataTestId,
  disabled,
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
      data-testid={dataTestId}
      disabled={disabled}
      className="rounded-full border border-gray-900/10 flex items-center gap-1.5 p-1"
    >
      <AssetComboIcon
        icon={selected?.icon}
        chainName={
          selected && isBaseToken(selected)
            ? selected.originChainName
            : undefined
        }
        chainIcon={chainIcon}
        showChainIcon={showChainIcon}
        sizeClassName="size-7"
      />

      <span className="flex items-center gap-1">
        <span className="text-base text-gray-900 font-semibold leading-none">
          {selected?.symbol ?? "Select token"}
        </span>
        <ChevronDownIcon className="size-4 text-gray-700" />
      </span>
    </button>
  )
}

export default SelectAssets
