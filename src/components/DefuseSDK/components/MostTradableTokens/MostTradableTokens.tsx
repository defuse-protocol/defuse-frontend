import { FireSimpleIcon } from "@phosphor-icons/react"
import { hasChainIcon } from "@src/app/(home)/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useCallback, useMemo, useState } from "react"
import { chainIcons } from "../../constants/blockchains"
import type { TokenInfo } from "../../types/base"
import { isBaseToken } from "../../utils"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip"
import styles from "./MostTradableTokens.module.css"

interface MostTradableTokensProps {
  onTokenSelect: (selectItemToken: SelectItemToken) => void
  tokenList: SelectItemToken[]
}

export function MostTradableTokens({
  onTokenSelect,
  tokenList,
}: MostTradableTokensProps) {
  const { data, isLoading, isError, refetch } = useMostTradableTokens()
  const [hasDataOnMount] = useState(() => Boolean(data?.tokens?.length))
  const tradableTokenList = useMemo(() => {
    if (!data?.tokens || !tokenList.length) return []

    const toKey = (symbol: string, chain: string) =>
      `${clickhouseSymbolToSymbol(symbol)}-${clickhouseChainToChainName(chain)}`
    const rankMap = new Map<string, number>()
    const volumeMap = new Map<string, number>()
    data.tokens.forEach(({ symbol_out, blockchain_out, volume }, idx) => {
      const key = toKey(symbol_out, blockchain_out)
      rankMap.set(key, idx)
      volumeMap.set(key, volume)
    })

    // Filter tokens that are in the rankMap
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
    const deduplicated = filtered.filter((token) => {
      const key = isBaseToken(token.token)
        ? toKey(token.token.symbol, token.token.chainName)
        : `${token.token.symbol}-unified`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by volume (descending) and limit to top 5
    return deduplicated
      .sort((a, b) => {
        const getVolume = (token: SelectItemToken) => {
          if (isBaseToken(token.token)) {
            const key = toKey(token.token.symbol, token.token.chainName)
            return volumeMap.get(key) || 0
          }
          // For grouped tokens, find the highest volume among grouped tokens
          return Math.max(
            ...token.token.groupedTokens.map((t) => {
              const key = toKey(t.symbol, t.chainName)
              return volumeMap.get(key) || 0
            })
          )
        }

        return getVolume(b) - getVolume(a)
      })
      .slice(0, 5)
  }, [data?.tokens, tokenList])

  if (isLoading || !hasDataOnMount || !tradableTokenList.length) return null

  return (
    <div className="flex items-center justify-between gap-3 min-h-12 w-full  bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0">
            <FireSimpleIcon
              className={`w-4 h-4 text-orange-500 transition-all duration-300 ${styles.fireIcon}`}
              aria-hidden="true"
              width={16}
              height={16}
            />
            <span className="hidden sm:inline">Top 5 traded (24h)</span>
            <span className="sm:hidden">Top 5 traded</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="z-50 max-w-xs" sideOffset={5}>
          These are the top-performing tokens based on their 24-hour trading
          volume.
        </TooltipContent>
      </Tooltip>

      <TokenList
        tradableTokenList={tradableTokenList}
        onTokenSelect={onTokenSelect}
      />

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
  onTokenSelect,
}: {
  tradableTokenList: SelectItemToken[]
  onTokenSelect: (t: SelectItemToken) => void
}) {
  const isFlatTokenListEnabled = useIsFlatTokenListEnabled()
  const showChainIcon = useCallback(
    (
      token: TokenInfo,
      chainIcon: { dark: string; light: string } | undefined
    ) => {
      return (
        (isFlatTokenListEnabled && chainIcon !== undefined) ||
        (chainIcon !== undefined &&
          hasChainIcon(
            token,
            tradableTokenList.map((t) => t.token)
          ))
      )
    },
    [tradableTokenList, isFlatTokenListEnabled]
  )

  return (
    <div
      className={`flex flex-nowrap overflow-x-auto overflow-y-hidden no-scrollbar min-w-0 gap-2 whitespace-nowrap ${styles.hideScrollbar}`}
    >
      {tradableTokenList.map((selectItemToken) => {
        const chainIcon = isBaseToken(selectItemToken.token)
          ? chainIcons[selectItemToken.token.chainName]
          : undefined
        return (
          <button
            key={`${selectItemToken.token.symbol}-${isBaseToken(selectItemToken.token) ? selectItemToken.token.chainName : "unified"}`}
            type="button"
            onClick={() => onTokenSelect(selectItemToken)}
            className="group relative shrink-0 flex flex-none items-center justify-center p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 touch-manipulation w-10 h-10"
          >
            <AssetComboIcon
              icon={selectItemToken.token.icon}
              name={selectItemToken.token.name}
              showChainIcon={showChainIcon(selectItemToken.token, chainIcon)}
              chainName={
                isBaseToken(selectItemToken.token)
                  ? selectItemToken.token.chainName
                  : undefined
              }
              chainIcon={chainIcon}
              style={{
                transform: showChainIcon(selectItemToken.token, chainIcon)
                  ? "scale(0.8)"
                  : "scale(1)",
              }}
            />
          </button>
        )
      })}
    </div>
  )
}

// Causion: Clickhouse use different symbol and chain name
function clickhouseSymbolToSymbol(symbol: string) {
  return symbol === "wNEAR" ? "NEAR" : symbol
}
// TODO: Not sure about this, more tokens bring more discripency, need to find a better way to handle this
function clickhouseChainToChainName(chain: string) {
  switch (chain) {
    case "sol":
      return "solana"
    case "zec":
      return "zcash"
    case "btc":
      return "bitcoin"
    case "xrp":
      return "xrpledger"
    case "avax":
      return "avalanche"
    case "doge":
      return "dogecoin"
    case "bera":
      return "berachain"
    case "arb":
      return "arbitrum"
    default:
      return chain
  }
}
