import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { useContext, useMemo } from "react"

import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types"
import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useTokenList } from "@src/hooks/useTokenList"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { type useRouter, useSearchParams } from "next/navigation"

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
}

export function useDeterminePair() {
  const { whitelabelTemplate } = useContext(FeatureFlagsContext)
  const searchParams = useSearchParams()
  const processedTokenList = useTokenList(LIST_TOKENS)

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const { tokenIn, tokenOut } = useMemo(() => {
    // First, try to get pair from URL params
    const urlPair = getPairFromUrlParams(fromParam, toParam, processedTokenList)
    if (urlPair) return urlPair

    // Fallback to whitelabelTemplate pair
    return getPairFromWhitelabelTemplate(whitelabelTemplate, processedTokenList)
  }, [fromParam, toParam, whitelabelTemplate, processedTokenList])

  return { tokenIn, tokenOut }
}

function getPairFromUrlParams(
  fromParam: string | null,
  toParam: string | null,
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
) {
  const fromToken = findTokenBySymbol(fromParam, tokenList)
  const toToken = findTokenBySymbol(toParam, tokenList)

  if (fromToken || toToken) {
    return { tokenIn: fromToken, tokenOut: toToken }
  }
  return null
}

function getPairFromWhitelabelTemplate(
  whitelabelTemplate: WhitelabelTemplateValue,
  tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]
) {
  const pair = pairs[whitelabelTemplate]
  if (!pair) return { tokenIn: null, tokenOut: null }

  const tokenIn = tokenList.find((token) => {
    return isBaseToken(token)
      ? token.defuseAssetId === pair[0]
      : token.groupedTokens.some(
          (t: BaseTokenInfo) => t.defuseAssetId === pair[0]
        )
  })

  const tokenOut = tokenList.find((token) => {
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
  tokens: (BaseTokenInfo | UnifiedTokenInfo)[]
): BaseTokenInfo | UnifiedTokenInfo | null {
  if (!input) return null
  return (
    tokens.find(
      (token) =>
        token.symbol === input ||
        (!isBaseToken(token) &&
          token.groupedTokens?.some((t: BaseTokenInfo) => t.symbol === input))
    ) ?? null
  )
}

export function updateURLParams({
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
