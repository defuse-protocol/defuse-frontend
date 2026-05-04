import type { TokenInfo } from "@src/components/DefuseSDK/types/base"
import { flattenTokenList } from "@src/components/DefuseSDK/utils/token"
import { useMemo } from "react"

export function useFlatTokenList(tokenList: TokenInfo[]) {
  return useMemo(() => flattenTokenList(tokenList), [tokenList])
}
