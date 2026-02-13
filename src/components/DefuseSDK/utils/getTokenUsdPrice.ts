import type { TokenUsdPriceData } from "@src/components/DefuseSDK/hooks/useTokensUsdPrices"
import type { TokenInfo } from "../types/base"
import { isBaseToken, isUnifiedToken } from "./token"

export function getTokenPrice(
  token: TokenInfo | null,
  priceData?: TokenUsdPriceData
): number | null {
  if (!priceData || !token) return null

  if (isBaseToken(token) && priceData[token.defuseAssetId]) {
    return priceData[token.defuseAssetId].price
  }

  if (isUnifiedToken(token)) {
    for (const grouped of token.groupedTokens) {
      if (isBaseToken(grouped) && priceData[grouped.defuseAssetId]) {
        return priceData[grouped.defuseAssetId].price
      }
    }
  }

  return null
}

const getTokenUsdPrice = (
  tokenAmount: string,
  token: TokenInfo | null,
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
