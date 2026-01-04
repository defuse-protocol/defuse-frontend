import { authIdentity } from "@defuse-protocol/internal-utils"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useSmartSearch } from "@src/hooks/useSmartSearch"
import { type SearchableItem, createSearchData } from "@src/utils/smartSearch"
import clsx from "clsx"
import { useEffect, useRef, useState } from "react"
import { useWatchHoldings } from "../../features/account/hooks/useWatchHoldings"
import type { BalanceMapping } from "../../features/machines/depositedBalanceMachine"
import { useModalStore } from "../../providers/ModalStoreProvider"
import { useTokensStore } from "../../providers/TokensStoreProvider"
import { ModalType } from "../../stores/modalStore"
import type { TokenInfo, TokenValue } from "../../types/base"
import { getTokenId, isBaseToken } from "../../utils/token"
import {
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
} from "../../utils/tokenUtils"
import AssetList from "../Asset/AssetList"
import EmptyAssetList from "../Asset/EmptyAssetList"
import { MostTradableTokens } from "../MostTradableTokens/MostTradableTokens"
import SearchBar from "../SearchBar"
import { ModalDialog } from "./ModalDialog"
import ModalNoResults from "./ModalNoResults"

export type ModalSelectAssetsPayload = {
  modalType?: ModalType.MODAL_SELECT_ASSETS
  token?: TokenInfo
  tokenIn?: TokenInfo
  tokenOut?: TokenInfo
  fieldName?: "tokenIn" | "tokenOut" | "token"
  /** @deprecated legacy props use holdings instead */
  balances?: BalanceMapping
  accountId?: string
  onConfirm?: (payload: ModalSelectAssetsPayload) => void
  isHoldingsEnabled?: boolean
  isMostTradableTokensEnabled?: boolean
}

export type SelectItemToken<T = TokenInfo> = SearchableItem & {
  token: T
  disabled: boolean
  selected: boolean
  defuseAssetId?: string
  usdValue?: number
  value?: TokenValue
  isHoldingsEnabled: boolean
}

export function ModalSelectAssets() {
  const [searchValue, setSearchValue] = useState("")
  const [assetList, setAssetList] = useState<SelectItemToken[]>([])
  const [notFilteredAssetList, setNotFilteredAssetList] = useState<
    SelectItemToken[]
  >([])
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { onCloseModal, modalType, payload } = useModalStore((state) => state)
  const tokens = useTokensStore((state) => state.tokens)
  // TODO: how we can avoid this cast?
  const modalPayload = payload as ModalSelectAssetsPayload

  const { state } = useConnectWallet()
  const userId =
    state.isVerified && state.address && state.chainType
      ? authIdentity.authHandleToIntentsUserId(state.address, state.chainType)
      : null
  const { data: holdings } = useWatchHoldings({ userId, tokenList: tokens })

  const handleSearchClear = () => setSearchValue("")

  const { results: searchResults } = useSmartSearch(assetList, searchValue, {
    maxResults: 100,
    maxFuzzyDistance: 1,
    debounceMs: 0, // We don't need debonce since we have a short list and can get results instantly, consider for future
  })

  const handleSelectToken = (selectedItem: SelectItemToken) => {
    if (modalType !== ModalType.MODAL_SELECT_ASSETS) {
      throw new Error("Invalid modal type")
    }

    const newPayload: ModalSelectAssetsPayload = {
      ...modalPayload,
      modalType: ModalType.MODAL_SELECT_ASSETS,
      [modalPayload.fieldName || "token"]: selectedItem.token,
    }
    onCloseModal(newPayload)

    if (newPayload?.onConfirm) {
      newPayload.onConfirm(newPayload)
    }
  }

  useEffect(() => {
    if (tokens.length === 0) {
      return
    }

    const fieldName = modalPayload.fieldName || "token"
    const selectToken = modalPayload[fieldName]

    const isHoldingsEnabled =
      modalPayload.isHoldingsEnabled ?? modalPayload.balances != null

    // TODO: remove this once we remove the legacy props
    const balances = modalPayload.balances ?? {}

    const selectedTokenId = selectToken
      ? isBaseToken(selectToken)
        ? selectToken.defuseAssetId
        : selectToken.unifiedAssetId
      : undefined

    const getAssetList: SelectItemToken[] = []

    for (const token of tokens) {
      const tokenId = getTokenId(token)
      const disabled = selectedTokenId != null && tokenId === selectedTokenId

      // TODO: remove this once we remove the legacy props
      const balance = computeTotalBalanceDifferentDecimals(token, balances)

      const findHolding = isHoldingsEnabled
        ? holdings?.find((holding) => getTokenId(holding.token) === tokenId)
        : undefined

      getAssetList.push({
        token,
        disabled,
        selected: disabled,
        usdValue: findHolding?.usdValue,
        value: findHolding?.value ?? balance,
        isHoldingsEnabled,
        searchData: createSearchData(token), // Preprocess search data for performance
      })
    }
    setNotFilteredAssetList(getAssetList)

    // Put tokens with balance on top
    getAssetList.sort((a, b) => {
      if (a.value == null && b.value == null) {
        return 0
      }
      if (a.value == null) {
        return 1
      }
      if (b.value == null) {
        return -1
      }
      return compareAmounts(b.value, a.value)
    })

    // Put tokens with usdValue on top
    getAssetList.sort((a, b) => {
      if (a.usdValue == null && b.usdValue == null) {
        return 0
      }
      if (a.usdValue == null) {
        return 1
      }
      if (b.usdValue == null) {
        return -1
      }
      return b.usdValue - a.usdValue
    })

    setAssetList(getAssetList)
  }, [tokens, modalPayload, holdings])

  const displayAssets = searchValue.trim() ? searchResults : assetList

  const is1cs = useIs1CsEnabled()

  const handleScroll = () => {
    if (!scrollContainerRef.current) return

    setIsScrolled(scrollContainerRef.current.scrollTop > 0)
  }

  return (
    <ModalDialog title="Select token">
      <div className="mt-2 h-[630px] flex flex-col">
        <div
          className={clsx(
            "pb-5 border-b -mx-5 px-5 transition-colors",
            isScrolled ? "border-gray-200" : "border-transparent"
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
          {modalPayload?.isMostTradableTokensEnabled && !searchValue ? (
            <MostTradableTokens
              tokenList={notFilteredAssetList}
              onTokenSelect={handleSelectToken}
            />
          ) : null}

          {assetList.length ? (
            <AssetList
              assets={displayAssets}
              handleSelectToken={handleSelectToken}
              accountId={modalPayload?.accountId}
              showChain={is1cs}
            />
          ) : (
            <EmptyAssetList />
          )}

          {searchValue.trim() && searchResults.length === 0 && (
            <ModalNoResults handleSearchClear={handleSearchClear} />
          )}
        </div>
      </div>
    </ModalDialog>
  )
}
