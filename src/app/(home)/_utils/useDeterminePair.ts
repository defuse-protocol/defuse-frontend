import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { isBaseToken, isUnifiedToken } from "@src/components/DefuseSDK/utils"
import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { LIST_TOKENS, LIST_TOKENS_FLATTEN } from "@src/constants/tokens"
import { useTokenList } from "@src/hooks/useTokenList"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import {
  type ReadonlyURLSearchParams,
  type useRouter,
  useSearchParams,
} from "next/navigation"
import { useContext, useMemo } from "react"

const pairs: Record<WhitelabelTemplateValue, [string, string]> = {
  "near-intents": [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:wrap.near",
  ],
  solswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:sol.omft.near",
  ],
  dogecoinswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:doge.omft.near",
  ],
  turboswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:a35923162c49cf95e6bf26623385eb431ad920d3.factory.bridge.near",
  ],
  trumpswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:sol-c58e6539c2f2e097c251f8edf11f9c03e581f8d4.omft.near",
  ],
  rabitswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:eth-0x8b1484d57abbe239bb280661377363b03c89caea.omft.near",
  ],
  omniswap: [
    "nep141:eth-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.omft.near",
    "nep141:wrap.near",
  ],
}

export function useDeterminePair() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const searchParams = useSearchParams()
  const processedTokenList = useTokenList(LIST_TOKENS)

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const { tokenIn, tokenOut } = useMemo(() => {
    const urlPair = getPairFromUrlParams(fromParam, toParam, processedTokenList)
    if (urlPair) return urlPair

    return getPairFromWhitelabelTemplate(whitelabelTemplate)
  }, [fromParam, toParam, whitelabelTemplate, processedTokenList])

  return { tokenIn, tokenOut }
}

function getPairFromUrlParams(
  fromParam: string | null,
  toParam: string | null,
  tokenList: TokenInfo[]
) {
  const fromToken = findTokenBySymbol(fromParam, tokenList)
  const toToken = findTokenBySymbol(toParam, tokenList)

  if (fromToken || toToken) {
    return { tokenIn: fromToken, tokenOut: toToken }
  }
  return null
}

function getPairFromWhitelabelTemplate(
  whitelabelTemplate: WhitelabelTemplateValue
) {
  const pair = pairs[whitelabelTemplate]
  if (!pair) return { tokenIn: null, tokenOut: null }

  const tokenIn = LIST_TOKENS.find((token) => {
    return isBaseToken(token)
      ? token.defuseAssetId === pair[0]
      : token.groupedTokens.some(
          (t: BaseTokenInfo) => t.defuseAssetId === pair[0]
        )
  })

  const tokenOut = LIST_TOKENS.find((token) => {
    return isBaseToken(token)
      ? token.defuseAssetId === pair[1]
      : token.groupedTokens.some(
          (t: BaseTokenInfo) => t.defuseAssetId === pair[1]
        )
  })

  return { tokenIn, tokenOut }
}

function findTokenBySymbol(
  input: string | null,
  tokens: TokenInfo[]
): TokenInfo | null {
  if (!input) {
    return null
  }

  const token =
    tokens.find(
      (token) =>
        token.symbol === input ||
        (!isBaseToken(token) &&
          token.groupedTokens?.some((t: BaseTokenInfo) => t.symbol === input))
    ) ?? null

  return token ?? tokenFromSymbolWithChainName(input)
}

export function updateURLParamsDeposit({
  tokenIn,
  tokenOut,
  router,
  searchParams,
}: {
  tokenIn: { symbol: string } | null
  tokenOut: { symbol: string } | null
  router: ReturnType<typeof useRouter>
  searchParams: ReturnType<typeof useSearchParams>
}) {
  const params = new URLSearchParams(searchParams.toString())
  if (tokenIn?.symbol) params.set("from", tokenIn.symbol)
  if (tokenOut?.symbol) params.set("to", tokenOut.symbol)

  router.replace(`?${params.toString()}`, { scroll: false })
}

export function updateURLParamsSwap({
  tokenIn,
  tokenOut,
  tokens,
  router,
  searchParams,
}: {
  tokenIn: TokenInfo | null
  tokenOut: TokenInfo | null
  tokens: TokenInfo[]
  router: ReturnType<typeof useRouter>
  searchParams: ReadonlyURLSearchParams
}) {
  const params = new URLSearchParams(searchParams.toString())
  const tokensWithTokenInAndOut = [...tokens]

  if (tokenIn !== null) {
    tokensWithTokenInAndOut.push(tokenIn)
  }
  if (tokenOut !== null) {
    tokensWithTokenInAndOut.push(tokenOut)
  }

  if (tokenIn?.symbol) {
    params.set("from", tokenToSymbol(tokenIn, tokensWithTokenInAndOut))
  }

  if (tokenOut?.symbol) {
    params.set("to", tokenToSymbol(tokenOut, tokensWithTokenInAndOut))
  }

  if (params.toString() !== searchParams.toString()) {
    router.replace(`?${params.toString()}`)
  }
}

function tokenToSymbol(token: TokenInfo, tokensWithTokenInAndOut: TokenInfo[]) {
  return hasChainIcon(token, tokensWithTokenInAndOut)
    ? tokenToSymbolWithChainName(token)
    : token.symbol
}

export function hasChainIcon(
  token: TokenInfo,
  tokens: TokenInfo[]
): token is BaseTokenInfo {
  return isUnifiedToken(token)
    ? false
    : tokens.filter(
        (t) =>
          (isBaseToken(t) ? token.defuseAssetId !== t.defuseAssetId : false) &&
          t.symbol === token.symbol
      ).length > 0
}

const SEPARATOR = ":"

function tokenToSymbolWithChainName(token: BaseTokenInfo) {
  return `${token.symbol}${SEPARATOR}${token.originChainName}`
}

export function tokenFromSymbolWithChainName(symbolWithChainName: string) {
  const [symbolWithoutChainName, chainName] = symbolWithChainName.split(
    SEPARATOR
  ) as [string, string | undefined]

  return (
    (chainName === undefined
      ? LIST_TOKENS.find((t) => t.symbol === symbolWithoutChainName)
      : LIST_TOKENS_FLATTEN.find(
          (t) =>
            t.symbol === symbolWithoutChainName &&
            t.originChainName === chainName
        )) ?? null
  )
}
