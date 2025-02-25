import { isBaseToken } from "@defuse-protocol/defuse-sdk"
import type { WhitelabelTemplateValue } from "@src/config/featureFlags"
import { LIST_TOKENS } from "@src/constants/tokens"
import { FeatureFlagsContext } from "@src/providers/FeatureFlagsProvider"
import { useContext } from "react"

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

  const pair = pairs[whitelabelTemplate]

  const tokenIn = LIST_TOKENS.find((token) => {
    if (isBaseToken(token)) {
      return token.defuseAssetId === pair[0]
    }

    return token.groupedTokens.some((t) => t.defuseAssetId === pair[0])
  })

  const tokenOut = LIST_TOKENS.find((token) => {
    if (isBaseToken(token)) {
      return token.defuseAssetId === pair[1]
    }

    return token.groupedTokens.some((t) => t.defuseAssetId === pair[1])
  })

  return { tokenIn, tokenOut }
}
