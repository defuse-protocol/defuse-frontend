"use client"

import AssetComboIcon from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { BaseModalDialog } from "@src/components/DefuseSDK/components/Modal/ModalDialog"
import SearchBar from "@src/components/DefuseSDK/components/SearchBar"
import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { getTokenId, isBaseToken } from "@src/components/DefuseSDK/utils/token"
import ListItem from "@src/components/ListItem"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useSmartSearch } from "@src/hooks/useSmartSearch"
import { type SearchableItem, createSearchData } from "@src/utils/smartSearch"
import clsx from "clsx"
import { useMemo, useRef, useState } from "react"
import ModalNoResults from "./DefuseSDK/components/Modal/ModalNoResults"

interface SimpleTokenSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (token: TokenInfo) => void
  selectedTokenId?: string
}

type SearchableToken = SearchableItem & {
  token: TokenInfo
  baseToken: BaseTokenInfo
}

export function SimpleTokenSelectModal({
  open,
  onClose,
  onSelect,
  selectedTokenId,
}: SimpleTokenSelectModalProps) {
  const [searchValue, setSearchValue] = useState("")
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  const searchableTokens = useMemo<SearchableToken[]>(() => {
    const result: SearchableToken[] = []

    for (const token of LIST_TOKENS) {
      if (isBaseToken(token)) {
        result.push({
          token,
          baseToken: token,
          searchData: createSearchData(token),
        })
      } else {
        const firstBaseToken = token.groupedTokens[0]
        if (firstBaseToken) {
          result.push({
            token,
            baseToken: firstBaseToken,
            searchData: createSearchData(token),
          })
        }
      }
    }

    return result
  }, [])

  const { results: searchResults, isLoading } = useSmartSearch(
    searchableTokens,
    searchValue,
    {
      maxResults: 100,
      maxFuzzyDistance: 1,
      debounceMs: 0,
    }
  )

  const displayTokens = searchValue.trim() ? searchResults : searchableTokens

  const handleScroll = () => {
    if (!scrollContainerRef.current) return
    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  const handleSelect = (item: SearchableToken) => {
    onSelect(item.token)
    onClose()
    setSearchValue("")
  }

  return (
    <BaseModalDialog
      open={open}
      onClose={onClose}
      title="Select token"
      ignoreSidebar
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
            autoFocus
          />
        </div>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="overflow-y-auto -mx-5 px-5 -mb-5 pb-5"
        >
          <h3 className="text-fg-secondary text-sm/6 font-medium">
            {searchValue.trim() ? "Search results" : "All tokens"}
          </h3>

          <div className="mt-2 flex flex-col gap-1">
            {displayTokens.map((item) => {
              const tokenId = getTokenId(item.token)
              const isSelected = tokenId === selectedTokenId

              return (
                <ListItem
                  key={tokenId}
                  onClick={() => handleSelect(item)}
                  highlight={isSelected}
                >
                  <AssetComboIcon icon={item.token.icon} />

                  <ListItem.Content>
                    <ListItem.Title>{item.token.name}</ListItem.Title>
                    <ListItem.Subtitle>{item.token.symbol}</ListItem.Subtitle>
                  </ListItem.Content>
                </ListItem>
              )
            })}
          </div>

          {searchValue.trim() && !isLoading && searchResults.length === 0 && (
            <ModalNoResults handleSearchClear={() => setSearchValue("")} />
          )}
        </div>
      </div>
    </BaseModalDialog>
  )
}
