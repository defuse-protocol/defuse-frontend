import { hasChainIcon } from "@src/app/(app)/(dashboard)/swap/_utils/useDeterminePair"
import { useIsFlatTokenListEnabled } from "@src/hooks/useIsFlatTokenListEnabled"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { useCallback, useMemo, useState } from "react"
import { chainIcons } from "../../constants/blockchains"
import type { TokenInfo } from "../../types/base"
import { isBaseToken } from "../../utils"
import AssetComboIcon from "../Asset/AssetComboIcon"
import type { SelectItemToken } from "../Modal/ModalSelectAssets"

const CLICKHOUSE_CHAIN_MAP: Record<string, string> = {
  sol: "solana",
  zec: "zcash",
  btc: "bitcoin",
  xrp: "xrpledger",
  avax: "avalanche",
  doge: "dogecoin",
  bera: "berachain",
  arb: "arbitrum",
  op: "optimism",
  pol: "polygon",
}

function normalizeSymbol(symbol: string): string {
  return symbol === "wNEAR" ? "NEAR" : symbol
}

function normalizeChain(chain: string): string {
  return CLICKHOUSE_CHAIN_MAP[chain] ?? chain
}

function createTokenKey(symbol: string, chain: string): string {
  return `${normalizeSymbol(symbol)}-${normalizeChain(chain)}`
}

function getSelectItemTokenKey(item: SelectItemToken): string {
  const { token } = item
  if (isBaseToken(token)) {
    return createTokenKey(token.symbol, token.originChainName)
  }
  return `${token.symbol}-unified`
}

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

    const volumeMap = new Map<string, number>()
    for (const { symbol_out, blockchain_out, volume } of data.tokens) {
      volumeMap.set(createTokenKey(symbol_out, blockchain_out), volume)
    }

    const getVolume = (item: SelectItemToken): number => {
      const { token } = item
      if (isBaseToken(token)) {
        return (
          volumeMap.get(createTokenKey(token.symbol, token.originChainName)) ??
          0
        )
      }
      const volumes = token.groupedTokens.map(
        (t) => volumeMap.get(createTokenKey(t.symbol, t.originChainName)) ?? 0
      )
      return Math.max(0, ...volumes)
    }

    const hasVolume = (item: SelectItemToken): boolean => {
      const { token } = item
      if (isBaseToken(token)) {
        return volumeMap.has(
          createTokenKey(token.symbol, token.originChainName)
        )
      }
      return token.groupedTokens.some((t) =>
        volumeMap.has(createTokenKey(t.symbol, t.originChainName))
      )
    }

    const seen = new Set<string>()
    return tokenList
      .filter((item) => {
        if (!hasVolume(item)) return false
        const key = getSelectItemTokenKey(item)
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
      .sort((a, b) => getVolume(b) - getVolume(a))
      .slice(0, 5)
  }, [data?.tokens, tokenList])

  if (isLoading || !hasDataOnMount || !tradableTokenList.length || isError) {
    return null
  }

  return (
    <div className="mb-8">
      <h3 className="text-gray-500 text-sm/6 font-medium">
        Most traded tokens
      </h3>

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
            // className="flex flex-col text-center items-center justify-center rounded-xl py-2 px-1.5 gap-1.5 hover:bg-gray-100 border border-gray-200"
            className="flex flex-col text-center items-center justify-center rounded-xl py-2 px-1.5 gap-1.5 hover:bg-gray-50 border border-gray-200 hover:border-gray-300"
          >
            <AssetComboIcon
              sizeClassName="size-7"
              icon={selectItemToken.token.icon}
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
