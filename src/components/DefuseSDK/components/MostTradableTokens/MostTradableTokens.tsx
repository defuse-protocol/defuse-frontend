import { FireIcon } from "@heroicons/react/20/solid"
import { useMostTradableTokens } from "@src/hooks/useMostTradableTokens"
import { Tooltip } from "radix-ui"
import { useMemo, useState } from "react"
import { isBaseToken } from "../../utils"
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

interface TradableTokenButtonProps {
  item: SelectItemToken
  onSelect: (item: SelectItemToken) => void
}

function TradableTokenButton({ item, onSelect }: TradableTokenButtonProps) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          onClick={() => onSelect(item)}
          className="size-7 rounded-md border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm hover:scale-105 flex items-center justify-center overflow-hidden transition-all duration-150"
        >
          <img
            src={item.token.icon}
            alt={item.token.name}
            className="size-5 rounded-full"
          />
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="bottom"
          sideOffset={4}
          className="bg-gray-900 rounded-lg px-2 py-1 text-white text-xs font-medium shadow-lg animate-in fade-in-0 zoom-in-95 duration-100"
        >
          {item.token.name}
          <Tooltip.Arrow className="fill-gray-900" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
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
    <div className="mb-4 flex items-center bg-gray-50 rounded-xl px-3 py-2">
      <FireIcon className="size-4 text-orange-500 shrink-0" />
      <span className="text-xs font-semibold text-gray-900 whitespace-nowrap ml-1.5">
        Top 5 traded (24h)
      </span>
      <Tooltip.Provider delayDuration={100}>
        <div className="flex items-center gap-1 ml-auto">
          {tradableTokenList.map((item) => (
            <TradableTokenButton
              key={getSelectItemTokenKey(item)}
              item={item}
              onSelect={onTokenSelect}
            />
          ))}
        </div>
      </Tooltip.Provider>
    </div>
  )
}
