import { X as CrossIcon } from "@phosphor-icons/react"
import { Text } from "@radix-ui/themes"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { Holding } from "../../features/account/types/sharedTypes"
import type { BalanceMapping } from "../../features/machines/depositedBalanceMachine"
import { useModalStore } from "../../providers/ModalStoreProvider"
import { useTokensStore } from "../../providers/TokensStoreProvider"
import { ModalType } from "../../stores/modalStore"
import type {
  BaseTokenInfo,
  TokenValue,
  UnifiedTokenInfo,
} from "../../types/base"
import { getTokenId, isBaseToken } from "../../utils/token"
import {
  compareAmounts,
  computeTotalBalanceDifferentDecimals,
} from "../../utils/tokenUtils"
import { AssetList } from "../Asset/AssetList"
import { EmptyAssetList } from "../Asset/EmptyAssetList"
import { SearchBar } from "../SearchBar"
import { ModalDialog } from "./ModalDialog"
import { ModalNoResults } from "./ModalNoResults"

export type Token = BaseTokenInfo | UnifiedTokenInfo

export type ModalSelectAssetsPayload = {
  modalType?: ModalType.MODAL_SELECT_ASSETS
  token?: Token
  tokenIn?: Token
  tokenOut?: Token
  fieldName?: "tokenIn" | "tokenOut" | "token"
  balances?: BalanceMapping
  accountId?: string
  onConfirm?: (payload: ModalSelectAssetsPayload) => void
  holdings?: Holding[]
}

export type SelectItemToken<T = Token> = {
  itemId: string
  token: T
  disabled: boolean
  selected: boolean
  defuseAssetId?: string
  balance?: TokenValue
  value?: TokenValue
  usdValue?: number
  transitValue?: TokenValue
  transitUsdValue?: number
}

export const ModalSelectAssets = () => {
  const [searchValue, setSearchValue] = useState("")
  const [assetList, setAssetList] = useState<SelectItemToken[]>([])

  const { onCloseModal, modalType, payload } = useModalStore((state) => state)
  const { data, isLoading } = useTokensStore((state) => state)
  const deferredQuery = useDeferredValue(searchValue)

  const handleSearchClear = () => setSearchValue("")

  const filterPattern = useCallback(
    (asset: SelectItemToken) => {
      const formattedQuery = deferredQuery.toLocaleUpperCase()

      return (
        asset.token.symbol.toLocaleUpperCase().includes(formattedQuery) ||
        asset.token.name.toLocaleUpperCase().includes(formattedQuery)
      )
    },
    [deferredQuery]
  )

  const handleSelectToken = (selectedItem: SelectItemToken) => {
    if (modalType !== ModalType.MODAL_SELECT_ASSETS) {
      throw new Error("Invalid modal type")
    }

    const newPayload: ModalSelectAssetsPayload = {
      ...(payload as ModalSelectAssetsPayload),
      modalType: ModalType.MODAL_SELECT_ASSETS,
      [(payload as ModalSelectAssetsPayload).fieldName || "token"]:
        selectedItem.token,
    }
    onCloseModal(newPayload)

    if (newPayload?.onConfirm) {
      newPayload.onConfirm(newPayload)
    }
  }

  useEffect(() => {
    if (!data.size && !isLoading) {
      return
    }

    const _payload = payload as ModalSelectAssetsPayload
    const fieldName = _payload.fieldName || "token"
    const selectToken = _payload[fieldName]

    const balances = _payload.balances ?? {}
    const holdings = _payload.holdings

    const selectedTokenId = selectToken
      ? isBaseToken(selectToken)
        ? selectToken.defuseAssetId
        : selectToken.unifiedAssetId
      : undefined

    const getAssetList: SelectItemToken[] = []

    for (const [tokenId, token] of data) {
      const disabled = selectedTokenId != null && tokenId === selectedTokenId
      const balance = computeTotalBalanceDifferentDecimals(token, balances)
      const findHolding = holdings?.find(
        (holding) => getTokenId(holding.token) === tokenId
      )
      getAssetList.push({
        itemId: tokenId,
        token,
        disabled,
        selected: disabled,
        balance,
        transitUsdValue: findHolding?.transitUsdValue,
        transitValue: findHolding?.transitValue,
        usdValue: findHolding?.usdValue,
        value: findHolding?.value,
      })
    }

    // Put tokens with balance on top
    getAssetList.sort((a, b) => {
      if (a.balance == null && b.balance == null) {
        return 0
      }
      if (a.balance == null) {
        return 1
      }
      if (b.balance == null) {
        return -1
      }
      return compareAmounts(b.balance, a.balance)
    })

    setAssetList(getAssetList)
  }, [data, isLoading, payload])

  const filteredAssets = useMemo(
    () => assetList.filter(filterPattern),
    [assetList, filterPattern]
  )

  return (
    <ModalDialog>
      <div className="flex flex-col min-h-[680px] md:max-h-[680px] h-full">
        <div className="z-20 h-auto flex-none -mt-[var(--inset-padding-top)] -mr-[var(--inset-padding-right)] -ml-[var(--inset-padding-left)] px-5 pt-7 pb-4 sticky -top-[var(--inset-padding-top)] bg-gray-1">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row justify-between items-center">
              <Text size="5" weight="bold">
                Select asset
              </Text>
              <button type="button" onClick={onCloseModal} className="p-3">
                <CrossIcon width={18} height={18} />
              </button>
            </div>
            <SearchBar query={searchValue} setQuery={setSearchValue} />
          </div>
        </div>
        <div className="z-10 flex-1 overflow-y-auto border-b border-gray-1 dark:border-black-950 -mr-[var(--inset-padding-right)] pr-[var(--inset-padding-right)]">
          {assetList.length ? (
            <AssetList
              assets={deferredQuery ? filteredAssets : assetList}
              className="h-full"
              handleSelectToken={handleSelectToken}
              accountId={(payload as ModalSelectAssetsPayload)?.accountId}
            />
          ) : (
            <EmptyAssetList className="h-full" />
          )}
          {deferredQuery && filteredAssets.length === 0 && (
            <ModalNoResults handleSearchClear={handleSearchClear} />
          )}
        </div>
      </div>
    </ModalDialog>
  )
}
