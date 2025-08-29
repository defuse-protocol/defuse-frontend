import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { CheckCircleIcon, XIcon } from "@phosphor-icons/react"
import { Text } from "@radix-ui/themes"
import { AssetComboIcon } from "@src/components/DefuseSDK/components/Asset/AssetComboIcon"
import { chainIcons1cs } from "@src/components/DefuseSDK/constants/blockchains"
import { formatTokenValue } from "@src/components/DefuseSDK/utils/format"
import { TOKEN_ICONS } from "@src/constants/tokens"
import clsx from "clsx"
import {
  type ReactNode,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react"
import type { BalanceMapping } from "../../features/machines/depositedBalanceMachine"
import { useModalStore } from "../../providers/ModalStoreProvider"
import { ModalType } from "../../stores/modalStore"
import type { TokenValue } from "../../types/base"
import { EmptyAssetList } from "../Asset/EmptyAssetList"
import { SearchBar } from "../SearchBar"
import { ModalDialog } from "./ModalDialog"
import { ModalNoResults } from "./ModalNoResults"

export type Token = TokenResponse

export type ModalSelectTokenPayload = {
  modalType?: ModalType.MODAL_SELECT_TOKEN
  token?: Token
  tokenIn?: Token
  tokenOut?: Token
  fieldName?: "tokenIn" | "tokenOut" | "token"
  balances?: BalanceMapping
  accountId?: string
  onConfirm?: (payload: ModalSelectTokenPayload) => void
  tokens?: Token[]
}

export type SelectItemToken<T = Token> = {
  itemId: string
  token: T
  disabled: boolean
  selected: boolean
  defuseAssetId?: string
  balance?: TokenValue
}

export const ModalSelectToken = () => {
  const [searchValue, setSearchValue] = useState("")
  const [assetList, setAssetList] = useState<SelectItemToken[]>([])

  const { onCloseModal, modalType, payload } = useModalStore((state) => state)
  const deferredQuery = useDeferredValue(searchValue)

  const handleSearchClear = () => setSearchValue("")

  const filterPattern = useCallback(
    (asset: SelectItemToken) => {
      const formattedQuery = deferredQuery.toLocaleUpperCase()

      return (
        asset.token.symbol.toLocaleUpperCase().includes(formattedQuery) ||
        asset.token.blockchain.toLocaleUpperCase().includes(formattedQuery)
      )
    },
    [deferredQuery]
  )

  const handleSelectToken = useCallback(
    (selectedItem: SelectItemToken<Token>) => {
      if (modalType !== ModalType.MODAL_SELECT_TOKEN) {
        throw new Error("Invalid modal type")
      }

      const newPayload: ModalSelectTokenPayload = {
        ...(payload as ModalSelectTokenPayload),
        modalType: ModalType.MODAL_SELECT_TOKEN,
        [(payload as ModalSelectTokenPayload).fieldName || "token"]:
          selectedItem.token,
      }
      onCloseModal(newPayload)

      if (newPayload?.onConfirm) {
        newPayload.onConfirm(newPayload)
      }
    },
    [modalType, payload, onCloseModal]
  )

  useEffect(() => {
    const _payload = payload as ModalSelectTokenPayload
    const fieldName = _payload.fieldName || "token"
    const selectToken = _payload[fieldName]
    const tokens = _payload.tokens
    const selectedTokenId = selectToken ? selectToken.assetId : undefined

    const getAssetList: SelectItemToken[] =
      tokens?.map((token) => {
        const selected = selectedTokenId === token.assetId
        return {
          itemId: token.assetId,
          token,
          disabled: selected,
          selected,
          balance: undefined,
        }
      }) ?? []

    setAssetList(getAssetList)
  }, [payload])

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
                Select token
              </Text>
              <button type="button" onClick={onCloseModal} className="p-3">
                <XIcon width={18} height={18} />
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
              accountId={(payload as ModalSelectTokenPayload)?.accountId}
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

type Props<T> = {
  assets: SelectItemToken<T>[]
  emptyState?: ReactNode
  className?: string
  accountId?: string
  handleSelectToken?: (token: SelectItemToken<T>) => void
}

export const AssetList = <T extends Token>({
  assets,
  className,
  handleSelectToken,
}: Props<T>) => {
  return (
    <div className={clsx("flex flex-col", className && className)}>
      {assets.map(({ itemId, token, selected, balance }, i) => {
        return (
          <button
            key={itemId}
            type="button"
            className={clsx(
              "flex justify-between items-center gap-3 p-2.5 rounded-md hover:bg-gray-3",
              { "bg-gray-3": selected }
            )}
            // biome-ignore lint/style/noNonNullAssertion: i is always within bounds
            onClick={() => handleSelectToken?.(assets[i]!)}
          >
            <div className="relative">
              <AssetComboIcon
                icon={TOKEN_ICONS[token.assetId]}
                name={token.symbol}
                showChainIcon={true}
                chainName={token.blockchain}
                chainIcon={chainIcons1cs[token.blockchain]}
              />
              {selected && (
                <div className="absolute top-1 -right-1.5 rounded-full">
                  <CheckCircleIcon width={12} height={12} weight="fill" />
                </div>
              )}
            </div>
            <div className="grow flex flex-col">
              <div className="flex justify-between items-center">
                <Text as="span" size="2" weight="medium">
                  {token.symbol}
                </Text>
                <Balance balance={balance} />
              </div>
              <div className="flex justify-between items-center text-gray-11">
                <Text as="span" size="2">
                  {token.blockchain.toUpperCase()}
                </Text>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function Balance({ balance }: { balance: TokenValue | undefined }) {
  return (
    <Text as="span" size="2" weight="medium">
      {balance != null
        ? formatTokenValue(balance.amount, balance.decimals, {
            min: 0.0001,
            fractionDigits: 4,
          })
        : null}
    </Text>
  )
}
