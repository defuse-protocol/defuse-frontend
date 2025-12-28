import { hasChainIcon } from "@src/app/(app)/(dashboard)/swap/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useCallback, useMemo, useState } from "react"
import { chainIcons } from "../../constants/blockchains"
import type { TokenInfo } from "../../types/base"
import { isBaseToken } from "../../utils"
import AssetComboIcon from "../Asset/AssetComboIcon"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"
import {} from "../Tooltip"

interface MostTradableTokensProps {
  onTokenSelect: (selectItemToken: SelectItemToken) => void
  tokenList: SelectItemToken[]
}

export function MostTradableTokens({
  onTokenSelect,
  tokenList,
}: MostTradableTokensProps) {
  const { data, isLoading, isError } = useMostTradableTokens()
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
    const filtered = tokenList.filter(({ token }) => {
      if (isBaseToken(token)) {
        return rankMap.has(toKey(token.symbol, token.originChainName))
      }
      return token.groupedTokens.some((t) =>
        rankMap.has(toKey(t.symbol, t.originChainName))
      )
    })

    // Deduplicate by normalized key
    const seen = new Set<string>()
    const deduplicated = filtered.filter(({ token }) => {
      const key = isBaseToken(token)
        ? toKey(token.symbol, token.originChainName)
        : `${token.symbol}-unified`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    // Sort by volume (descending) and limit to top 5
    return deduplicated
      .sort((a, b) => {
        const getVolume = ({ token }: SelectItemToken) => {
          if (isBaseToken(token)) {
            const key = toKey(token.symbol, token.originChainName)
            return volumeMap.get(key) || 0
          }
          // For grouped tokens, find the highest volume among grouped tokens
          const vols = token.groupedTokens.map((t) => {
            const key = toKey(t.symbol, t.originChainName)
            return volumeMap.get(key) ?? 0
          })
          return vols.length ? Math.max(...vols) : 0
        }

        return getVolume(b) - getVolume(a)
      })
      .slice(0, 5)
  }, [data?.tokens, tokenList])

  if (isLoading || !hasDataOnMount || !tradableTokenList.length || isError) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-gray-500 text-sm font-medium">Most traded tokens</h3>

      <TokenList
        tradableTokenList={tradableTokenList}
        onTokenSelect={onTokenSelect}
      />
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
    <div className="grid grid-cols-5 gap-1 mt-3">
      {tradableTokenList.map((selectItemToken) => {
        const chainIcon = isBaseToken(selectItemToken.token)
          ? chainIcons[selectItemToken.token.originChainName]
          : undefined

        return (
          <button
            key={`${selectItemToken.token.symbol}-${isBaseToken(selectItemToken.token) ? selectItemToken.token.originChainName : "unified"}`}
            type="button"
            onClick={() => onTokenSelect(selectItemToken)}
            className="flex flex-col text-center items-center justify-center rounded-xl py-2 px-1.5 gap-1.5 hover:bg-gray-100 border border-gray-200"
          >
            <AssetComboIcon
              size="sm"
              icon={selectItemToken.token.icon}
              name={selectItemToken.token.name}
              showChainIcon={showChainIcon(selectItemToken.token, chainIcon)}
              chainName={
                isBaseToken(selectItemToken.token)
                  ? selectItemToken.token.originChainName
                  : undefined
              }
              chainIcon={chainIcon}
            />
            <div className="text-sm font-semibold text-gray-900 w-full min-w-0 truncate">
              {selectItemToken.token.symbol}
            </div>
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
    case "aptos":
      return "aptos"
    case "base":
      return "base"
    case "bsc":
      return "bsc"
    case "cardano":
      return "cardano"
    case "eth":
      return "eth"
    case "gnosis":
      return "gnosis"
    case "near":
      return "near"
    case "op":
      return "optimism"
    case "pol":
      return "polygon"
    case "stellar":
      return "stellar"
    case "sui":
      return "sui"
    case "ton":
      return "ton"
    case "tron":
      return "tron"
    default:
      return chain
  }
}
