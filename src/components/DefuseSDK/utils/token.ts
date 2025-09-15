import type {
  BaseTokenInfo,
  FungibleTokenInfo,
  NativeTokenInfo,
  TokenAbstractId,
  UnifiedTokenInfo,
} from "../types/base"

export function isBaseToken(
  token: BaseTokenInfo | UnifiedTokenInfo
): token is BaseTokenInfo {
  return "defuseAssetId" in token
}

export function isUnifiedToken(
  token: BaseTokenInfo | UnifiedTokenInfo
): token is UnifiedTokenInfo {
  return "unifiedAssetId" in token
}

export function isFungibleToken(
  token: BaseTokenInfo | UnifiedTokenInfo
): token is FungibleTokenInfo {
  return isBaseToken(token) && "address" in token && token.address !== "native"
}

export function isNativeToken(
  token: BaseTokenInfo | UnifiedTokenInfo
): token is NativeTokenInfo {
  return isBaseToken(token) && "type" in token && token.type === "native"
}

export function getTokenId(token: BaseTokenInfo | UnifiedTokenInfo) {
  if (isBaseToken(token)) {
    return token.defuseAssetId
  }
  if (isUnifiedToken(token)) {
    return token.unifiedAssetId
  }
  throw new Error("Invalid token type")
}

/**
 * Converts unified tokens to regular tokens, preserving tags.
 */
export function flattenTokenList(
  list: (BaseTokenInfo | UnifiedTokenInfo)[]
): BaseTokenInfo[] {
  return list.flatMap((t): BaseTokenInfo[] => {
    if (isBaseToken(t)) {
      return [t]
    }
    return t.groupedTokens.map((tt) => ({
      ...tt,
      symbol: `${tt.symbol} (${tt.chainName})`,
      tags: t.tags,
    }))
  })
}

/**
 * Extracts the AID from a token.
 */
export function getTokenAid<T extends { tags?: string[] }>(
  t: T
): TokenAbstractId | null {
  const tag = t.tags?.find((t) => t.startsWith("aid:"))
  if (tag != null) {
    return tag.split(":")[1]
  }
  return null
}
