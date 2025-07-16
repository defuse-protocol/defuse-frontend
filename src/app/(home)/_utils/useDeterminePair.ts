import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { useContext, useMemo } from "react"

import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types"
import { LIST_TOKENS } from "@src/constants/tokens"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { type useRouter, useSearchParams } from "next/navigation"

const pairs: Record<string, [string, string]> = {
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

  const fromParam = searchParams.get("from")
  const toParam = searchParams.get("to")

  const { tokenIn, tokenOut } = useMemo(() => {
    // First, try to get pair from URL params
    const urlPair = getPairFromUrlParams(fromParam, toParam)
    if (urlPair) return urlPair

    // Fallback to whitelabelTemplate pair
    return getPairFromWhitelabelTemplate(whitelabelTemplate)
  }, [fromParam, toParam, whitelabelTemplate])

  return { tokenIn, tokenOut }
}

function getPairFromUrlParams(
  fromParam: string | null,
  toParam: string | null
) {
  const fromToken = findTokenBySymbolOrDefuseId(fromParam, LIST_TOKENS)
  const toToken = findTokenBySymbolOrDefuseId(toParam, LIST_TOKENS)

  if (fromToken || toToken) {
    return { tokenIn: fromToken, tokenOut: toToken }
  }
  return null
}

function getPairFromWhitelabelTemplate(whitelabelTemplate: string) {
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

function findTokenBySymbolOrDefuseId(
  input: string | null,
  tokens: (BaseTokenInfo | UnifiedTokenInfo)[]
): BaseTokenInfo | UnifiedTokenInfo | null {
  if (!input) return null

  const upper = input.toUpperCase()

  return (
    tokens.find(
      (token) =>
        token.symbol.toUpperCase() === upper ||
        (!isBaseToken(token) &&
          token.groupedTokens?.some(
            (t: BaseTokenInfo) => t.symbol.toUpperCase() === upper
          ))
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
