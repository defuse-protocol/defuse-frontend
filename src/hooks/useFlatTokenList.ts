import { flattenTokenList } from "@src/components/DefuseSDK/utils/token"
import {
  type TokenWithTags,
  addChainToTokenSymbol,
} from "@src/constants/tokens"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useIs1CsEnabled } from "./useIs1CsEnabled"

export function useFlatTokenList(tokenList: TokenWithTags[]) {
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")
  const is1cs = useIs1CsEnabled()

  return useMemo(() => {
    if (flatListIsEnabled || is1cs) {
      return flattenTokenList(tokenList).map((t) => {
        return addChainToTokenSymbol(t)
      })
    }
    return tokenList
  }, [flatListIsEnabled, is1cs, tokenList])
}
