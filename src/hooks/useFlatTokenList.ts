import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { flattenTokenList } from "@src/components/DefuseSDK/utils/token"
import { useSearchParams } from "next/navigation"
import { useMemo } from "react"
import { useIs1CsEnabled } from "./useIs1CsEnabled"

export function useFlatTokenList(tokenList: TokenInfo[], supports1cs = false) {
  const searchParams = useSearchParams()
  const flatListIsEnabled = !!searchParams.get("flatTokenList")
  const is1cs = useIs1CsEnabled() && supports1cs

  return useMemo(() => {
    if (flatListIsEnabled || is1cs) {
      return flattenTokenList(tokenList)
    }
    return tokenList
  }, [flatListIsEnabled, is1cs, tokenList])
}
