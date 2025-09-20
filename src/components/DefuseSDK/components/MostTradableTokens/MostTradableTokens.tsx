import { FireSimpleIcon } from "@phosphor-icons/react"
import { Spinner } from "@radix-ui/themes"
import { chainIcons } from "@src/components/DefuseSDK/constants/blockchains"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useMemo } from "react"
import { isBaseToken } from "../../utils"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"
import { TooltipInfo } from "../TooltipInfo"
import styles from "./MostTradableTokens.module.css"

interface MostTradableTokensProps {
  onTokenSelect: (selectItemToken: SelectItemToken) => void
  tokenList: SelectItemToken[]
}

export function MostTradableTokens({
  onTokenSelect,
  tokenList,
}: MostTradableTokensProps) {
  const { data, isLoading, isError, refetch } = useMostTradableTokens(tokenList)
  const tradableTokenList = useMemo(() => {
    if (!data?.tokens || !tokenList.length) return []

    const toKey = (symbol: string, chain: string) =>
      `${wrapNearAdapter(symbol)}-${chain.toLowerCase()}`
    const rankMap = new Map<string, number>()
    data.tokens.forEach(({ symbol_out, blockchain_out }, idx) => {
      rankMap.set(toKey(symbol_out, blockchain_out), idx)
    })

    const filtered = tokenList.filter((token) => {
      if (isBaseToken(token.token)) {
        return rankMap.has(toKey(token.token.symbol, token.token.chainName))
      }
      return token.token.groupedTokens.some((t) =>
        rankMap.has(toKey(t.symbol, t.chainName))
      )
    })

    // Deduplicate by normalized key
    const seen = new Set<string>()
    return filtered.filter((token) => {
      const key = isBaseToken(token.token)
        ? toKey(token.token.symbol, token.token.chainName)
        : `${token.token.symbol}-unified`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [data?.tokens, tokenList])

  if (!tradableTokenList && !isLoading) return null

  return (
    <div className="flex items-center gap-3 min-h-12 w-full min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
      <span className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0">
        <TooltipInfo
          icon={
            <button
              type="button"
              className="flex items-center gap-2 focus:outline-none transition-colors hover:text-gray-900 dark:hover:text-gray-100"
              aria-label="Information about most tradable tokens"
            >
              <FireSimpleIcon
                className={`w-4 h-4 text-orange-500 transition-all duration-300 ${styles.fireIcon}`}
                aria-hidden="true"
                width={16}
                height={16}
              />
              Most tradable
            </button>
          }
        >
          This is the top-performing tokens based on their 24-hour trading
          volume.
        </TooltipInfo>
      </span>

      <div className="flex-1 min-w-0 basis-0">
        <TokenList
          tradableTokenList={tradableTokenList}
          isLoading={isLoading}
          onTokenSelect={onTokenSelect}
        />
      </div>

      {isError && (
        <div className="flex gap-1 items-center">
          <span className="text-xs font-medium text-red-500">
            Failed to load tokens
          </span>

          <button
            type="button"
            className="px-2 py-1 my-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={() => refetch()}
          >
            retry
          </button>
        </div>
      )}
    </div>
  )
}

function TokenList({
  tradableTokenList,
  isLoading,
  onTokenSelect,
}: {
  tradableTokenList: SelectItemToken[]
  isLoading: boolean
  onTokenSelect: (t: SelectItemToken) => void
}) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto min-w-0 ${styles.hideScrollbar}`}
    >
      {isLoading ? (
        <div className="flex justify-center items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 w-full shadow-sm">
          <Spinner size="1" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Loading tokens...
          </span>
        </div>
      ) : (
        tradableTokenList.map((selectItemToken) => {
          const chainIcon = isBaseToken(selectItemToken.token)
            ? chainIcons[selectItemToken.token.chainName]
            : undefined

          return (
            <button
              key={`${selectItemToken.token.symbol}-${isBaseToken(selectItemToken.token) ? selectItemToken.token.chainName : "unified"}`}
              type="button"
              onClick={() => onTokenSelect(selectItemToken)}
              className="group relative shrink-0 flex items-center justify-center p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 touch-manipulation w-10 h-10"
              title={`${selectItemToken.token.name}${isBaseToken(selectItemToken.token) ? ` (${selectItemToken.token.chainName})` : ""}`}
            >
              <AssetComboIcon
                icon={selectItemToken.token.icon}
                name={selectItemToken.token.name}
                showChainIcon={chainIcon !== undefined}
                chainIcon={chainIcon}
              />
            </button>
          )
        })
      )}
    </div>
  )
}

// Edge case for NEAR, where the symbol is wNEAR
function wrapNearAdapter(symbol: string) {
  return symbol === "wNEAR" ? "NEAR" : symbol
}
