import type { TokenResponse } from "@defuse-protocol/one-click-sdk-typescript"
import { isBaseToken } from "@src/components/DefuseSDK/utils/token"
import type { TokenWithTags } from "@src/constants/tokens"

/**
 * Filter tokenList to include only tokens that are supported by 1CS
 * @param tokenList - The full list of available tokens
 * @param oneClickTokens - Tokens returned from OneClickService.getTokens()
 * @returns Filtered token list containing only 1CS-supported tokens
 */
export function filter1csTokens(
  tokenList: TokenWithTags[],
  oneClickTokens: TokenResponse[]
): TokenWithTags[] {
  // Create a Set of asset IDs for fast lookup
  const oneClickAssetIds = new Set(oneClickTokens.map((token) => token.assetId))

  return tokenList.filter((token) => {
    if (isBaseToken(token)) {
      // For base tokens, check if the defuseAssetId matches any 1CS assetId
      return oneClickAssetIds.has(token.defuseAssetId)
    }

    // For unified tokens, check if any of the grouped tokens' defuseAssetId matches
    // Use the first token's defuseAssetId as requested
    const firstTokenAssetId = token.groupedTokens[0]?.defuseAssetId
    return firstTokenAssetId && oneClickAssetIds.has(firstTokenAssetId)
  })
}
