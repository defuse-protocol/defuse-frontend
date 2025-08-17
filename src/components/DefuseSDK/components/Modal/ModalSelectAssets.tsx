import { authIdentity } from "@defuse-protocol/internal-utils"
import { X as CrossIcon } from "@phosphor-icons/react"
import { Text } from "@radix-ui/themes"
import { useConnectWallet } from "@src/hooks/useConnectWallet"
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import { useWatchHoldings } from "../../features/account/hooks/useWatchHoldings"
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
import { compareAmounts } from "../../utils/tokenUtils"
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
  holdings?: boolean
}

export type SelectItemToken<T = Token> = {
  token: T
  disabled: boolean
  selected: boolean
  defuseAssetId?: string
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

  const { state } = useConnectWallet()
  const userId =
    state.isVerified && state.address && state.chainType
      ? authIdentity.authHandleToIntentsUserId(state.address, state.chainType)
      : null
  const holdings = useWatchHoldings({
    userId,
    tokenList: Array.from(data.values()),
  })

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

    const payload_ = payload as ModalSelectAssetsPayload
    const fieldName = payload_.fieldName || "token"
    const selectToken = payload_[fieldName]

    const isHoldingsEnabled = payload_.holdings ?? false

    const selectedTokenId = selectToken
      ? isBaseToken(selectToken)
        ? selectToken.defuseAssetId
        : selectToken.unifiedAssetId
      : undefined

    const getAssetList: SelectItemToken[] = []

    for (const [tokenId, token] of data) {
      const disabled = selectedTokenId != null && tokenId === selectedTokenId
      const findHolding = isHoldingsEnabled
        ? holdings?.find((holding) => getTokenId(holding.token) === tokenId)
        : undefined

      getAssetList.push({
        token,
        disabled,
        selected: disabled,
        transitUsdValue: findHolding?.transitUsdValue,
        transitValue: findHolding?.transitValue,
        usdValue: findHolding?.usdValue,
        value: findHolding?.value,
      })
    }

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
  }, [data, isLoading, payload, holdings])

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
