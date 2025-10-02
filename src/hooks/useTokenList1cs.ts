"use client"

import { getTokens } from "@src/components/DefuseSDK/features/machines/1cs"
import { isBaseToken } from "@src/components/DefuseSDK/utils"
import { LIST_TOKENS } from "@src/constants/tokens"
import { useIs1CsEnabled } from "@src/hooks/useIs1CsEnabled"
import { useTokenList } from "@src/hooks/useTokenList"
import { useQuery } from "@tanstack/react-query"
import { useMemo } from "react"

// These tokens no longer tradable and might be removed in future.
const TOKENS_WITHOUT_REF_AND_BRRR = LIST_TOKENS.filter(
  (token) => token.symbol !== "REF" && token.symbol !== "BRRR"
)

export function useTokenList1cs() {
  const tokenList = useTokenList(TOKENS_WITHOUT_REF_AND_BRRR, true)

  const { data: oneClickTokens, isLoading: is1csTokensLoading } = useQuery({
    queryKey: ["1cs-tokens"],
    queryFn: () => getTokens(),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  })

  const is1cs = useIs1CsEnabled()

  return useMemo(() => {
    if (!is1cs || !oneClickTokens || is1csTokensLoading) {
      return tokenList
    }

    const oneClickAssetIds = new Set(
      oneClickTokens.map((token) => token.assetId)
    )

    return tokenList.filter((token) => {
      return isBaseToken(token)
        ? oneClickAssetIds.has(token.defuseAssetId)
        : oneClickAssetIds.has(token.groupedTokens[0]?.defuseAssetId)
    })
  }, [is1cs, tokenList, oneClickTokens, is1csTokensLoading])
}
