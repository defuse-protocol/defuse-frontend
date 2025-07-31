import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"
import type { SwappableToken } from "@src/components/DefuseSDK/types/swap"
import { useEffect } from "react"
import { useTokensStore } from "../providers/TokensStoreProvider"

export function TokenListUpdater<
  T extends {
    tokenList: (BaseTokenInfo | UnifiedTokenInfo | SwappableToken)[]
  },
>({ tokenList }: { tokenList: T["tokenList"] }) {
  const { updateTokens } = useTokensStore((state) => state)

  useEffect(() => {
    updateTokens(tokenList)
  }, [tokenList, updateTokens])

  return null
}
