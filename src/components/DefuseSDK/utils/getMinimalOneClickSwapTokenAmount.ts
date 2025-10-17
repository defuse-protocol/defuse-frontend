import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "../types/base"
import { parseUnits } from "./parse"
import { isBaseToken, isUnifiedToken } from "./token"

const MINIMAL_ONE_CLICK_SWAP_USD_AMOUNT = 0.01

// 1Click swap deposit required amount for 0.01$ in tokens amount
export const getMinimalOneClickSwapTokenAmount = (
  token: TokenInfo | null,
  tokensUsdPriceData?: TokenUsdPriceData
): bigint | null => {
  try {
    if (!tokensUsdPriceData || !token) return null

    let tokenUsdPriceData = null
    if (isBaseToken(token) && tokensUsdPriceData[token.defuseAssetId]) {
      tokenUsdPriceData = tokensUsdPriceData[token.defuseAssetId]
    } else if (isUnifiedToken(token)) {
      for (const groupedToken of token.groupedTokens) {
        if (
          isBaseToken(groupedToken) &&
          tokensUsdPriceData[groupedToken.defuseAssetId]
        ) {
          tokenUsdPriceData = tokensUsdPriceData[groupedToken.defuseAssetId]
          break
        }
      }
    }
    if (!tokenUsdPriceData || tokenUsdPriceData.price === 0) return null

    // Calculate token amount for minimal 1CS amount: USD amount / price per token
    const tokenAmount =
      MINIMAL_ONE_CLICK_SWAP_USD_AMOUNT / tokenUsdPriceData.price
    const amountInSmallestUnit = parseUnits(
      tokenAmount.toString(),
      tokenUsdPriceData.decimals
    )
    return amountInSmallestUnit
  } catch {
    return null
  }
}
