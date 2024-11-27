import { useContext } from "react"

import {
  type BaseTokenInfo,
  type UnifiedTokenInfo,
  isBaseToken,
} from "@defuse-protocol/defuse-sdk"
import { useFlatTokenList } from "@src/hooks/useFlatTokenList"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"

export function useTokenList(tokenList: (BaseTokenInfo | UnifiedTokenInfo)[]) {
  let list = useFlatTokenList(tokenList)

  const flags = useContext(FeatureFlagsContext)

  if (flags.dogecoin) {
    list = list.filter((token) => {
      if (isBaseToken(token)) {
        return token.chainName !== "dogecoin"
      }
      return true
    })
  }

  return list
}
