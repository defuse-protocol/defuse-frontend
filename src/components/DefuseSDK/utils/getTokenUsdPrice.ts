import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { SwappableToken } from "@src/components/DefuseSDK/types/swap"
import { isBaseToken, isUnifiedToken } from "./token"

const getTokenUsdPrice = (
  tokenAmount: string,
  token: SwappableToken | null,
  tokensUsdPriceData?: TokenUsdPriceData
): number | null => {
  try {
    if (!tokensUsdPriceData || !token || !tokenAmount) return null
    const numberTokenAmount = +tokenAmount
    if (Number.isNaN(numberTokenAmount) || !Number.isFinite(numberTokenAmount))
      return null
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
    if (!tokenUsdPriceData) return null
    return numberTokenAmount * tokenUsdPriceData.price
  } catch {
    return null
  }
}
export default getTokenUsdPrice
