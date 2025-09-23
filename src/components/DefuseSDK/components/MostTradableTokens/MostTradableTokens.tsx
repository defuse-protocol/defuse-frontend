import { FireSimpleIcon } from "@phosphor-icons/react"
import { hasChainIcon } from "@src/app/(home)/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useCallback, useMemo, useState } from "react"
import { chainIcons } from "../../constants/blockchains"
import type { TokenInfo } from "../../types/base"
import { isBaseToken } from "../../utils"
import { AssetComboIcon } from "../Asset/AssetComboIcon"
import { Tooltip, TooltipContent, TooltipTrigger } from "../Tooltip"
import styles from "./MostTradableTokens.module.css"

interface MostTradableTokensProps {
  onTokenSelect: (selectItemToken: TokenInfo) => void
  tokenList: TokenInfo[]
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
      `${wrapNearAdapter(symbol)}-${chain.toLowerCase()}`
    const rankMap = new Map<string, number>()
    data.tokens.forEach(({ symbol_out, blockchain_out }, idx) => {
      rankMap.set(toKey(symbol_out, blockchain_out), idx)
    })

    const filtered = tokenList.filter((token) => {
      if (isBaseToken(token)) {
        return rankMap.has(toKey(token.symbol, token.chainName))
      }
      return token.groupedTokens.some((t) =>
        rankMap.has(toKey(t.symbol, t.chainName))
      )
    })

    // Deduplicate by normalized key
    const seen = new Set<string>()
    return filtered.filter((token) => {
      const key = isBaseToken(token)
        ? toKey(token.symbol, token.chainName)
        : `${token.symbol}-unified`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [data?.tokens, tokenList])

  if (isLoading || !hasDataOnMount || !tradableTokenList.length) return null

  return (
    <div className="flex items-center gap-3 min-h-12 w-full  bg-gray-50 dark:bg-gray-900/50 rounded-xl px-4 py-2 border border-gray-200 dark:border-gray-700">
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap shrink-0">
            <FireSimpleIcon
              className={`w-4 h-4 text-orange-500 transition-all duration-300 ${styles.fireIcon}`}
              aria-hidden="true"
              width={16}
              height={16}
            />
            Most tradable
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
  tradableTokenList: TokenInfo[]
  onTokenSelect: (t: TokenInfo) => void
}) {
  const isFlatTokenListEnabled = useIsFlatTokenListEnabled()
  const showChainIcon = useCallback(
    (
      token: TokenInfo,
      chainIcon: { dark: string; light: string } | undefined
    ) => {
      return (
        (isFlatTokenListEnabled && chainIcon !== undefined) ||
        (chainIcon !== undefined && hasChainIcon(token, tradableTokenList))
      )
    },
    [tradableTokenList, isFlatTokenListEnabled]
  )

  return (
    <div
      className={`flex flex-nowrap overflow-x-auto overflow-y-hidden no-scrollbar min-w-0 max-w-full gap-2 whitespace-nowrap ${styles.hideScrollbar}`}
    >
      {tradableTokenList.map((selectItemToken) => {
        const chainIcon = isBaseToken(selectItemToken)
          ? chainIcons[selectItemToken.chainName]
          : undefined
        return (
          <button
            key={`${selectItemToken.symbol}-${isBaseToken(selectItemToken) ? selectItemToken.chainName : "unified"}`}
            type="button"
            onClick={() => onTokenSelect(selectItemToken)}
            className="group relative shrink-0 flex flex-none items-center justify-center p-1 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-all duration-200 touch-manipulation w-10 h-10"
          >
            <AssetComboIcon
              icon={selectItemToken.icon}
              name={selectItemToken.name}
              showChainIcon={showChainIcon(selectItemToken, chainIcon)}
              chainName={
                isBaseToken(selectItemToken)
                  ? selectItemToken.chainName
                  : undefined
              }
              chainIcon={chainIcon}
            />
          </button>
        )
      })}
    </div>
  )
}

// Edge case for NEAR, where the symbol is wNEAR
function wrapNearAdapter(symbol: string) {
  return symbol === "wNEAR" ? "NEAR" : symbol
}
