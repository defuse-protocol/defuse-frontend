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
  const oneClickAssetIds = new Set(oneClickTokens.map((token) => token.assetId))

  return tokenList.filter((token) => {
    return isBaseToken(token)
      ? oneClickAssetIds.has(token.defuseAssetId)
      : oneClickAssetIds.has(token.groupedTokens[0]?.defuseAssetId)
  })
}
