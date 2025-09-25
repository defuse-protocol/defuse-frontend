import type {
  BaseTokenInfo,
  TokenInfo,
} from "@src/components/DefuseSDK/types/base"
import { isUnifiedToken } from "../../../utils/token"

export function findTokenFromDiff(
  tokenDiff: Record<BaseTokenInfo["defuseAssetId"], bigint>,
  tokenList: TokenInfo[]
) {
  const defuseAssetId = Object.keys(tokenDiff)[0]
  const result = tokenList.find((t) => {
    if (isUnifiedToken(t)) {
      return t.groupedTokens.some((t) => t.defuseAssetId === defuseAssetId)
    }
    return t.defuseAssetId === defuseAssetId
  })
  if (!result) {
    throw new Error(`Token not found: ${defuseAssetId}`)
  }
  return result
}
