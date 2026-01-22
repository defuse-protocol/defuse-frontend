import type {
  BaseTokenInfo,
  FungibleTokenInfo,
  NativeTokenInfo,
  TokenAbstractId,
  TokenDeployment,
  TokenInfo,
  UnifiedTokenInfo,
} from "../types/base"
import { getAnyBaseTokenInfo } from "./tokenUtils"

export function isBaseToken(token: TokenInfo): token is BaseTokenInfo {
  return "defuseAssetId" in token
}

export function isUnifiedToken(token: TokenInfo): token is UnifiedTokenInfo {
  return "unifiedAssetId" in token
}

export function isFungibleToken(
  token: TokenDeployment
): token is FungibleTokenInfo {
  return "address" in token && token.address !== "native"
}

export function isNativeToken(
  token: TokenDeployment
): token is NativeTokenInfo {
  return "type" in token && token.type === "native"
}

// Note: Use this function only when you need either the unified or base token ID
/** @deprecated We should migrate to getDefuseAssetId instead */
export function getTokenId(token: TokenInfo) {
  if (isBaseToken(token)) {
    return token.defuseAssetId
  }
  if (isUnifiedToken(token)) {
    return token.unifiedAssetId
  }
  throw new Error("Invalid token type")
}

export function getDefuseAssetId(token: TokenInfo) {
  if (isUnifiedToken(token)) {
    return getAnyBaseTokenInfo(token).defuseAssetId
  }
  return token.defuseAssetId
}

/**
 * Converts unified tokens to regular tokens, preserving tags.
 */
export function flattenTokenList(list: TokenInfo[]): BaseTokenInfo[] {
  return list.flatMap((t): BaseTokenInfo[] => {
    if (isBaseToken(t)) {
      return [t]
    }

    return t.groupedTokens.map((tt) => {
      const mergedTags = Array.from(
        new Set([...(t.tags ?? []), ...(tt.tags ?? [])])
      )
      return Object.assign(
        {},
        tt,
        mergedTags.length > 0 ? { tags: mergedTags } : {}
      )
    })
  })
}

/**
 * Attaches tags from UnifiedTokenInfo to BaseTokenInfo.
 */
export function inheritTokenTags(list: TokenInfo[]): TokenInfo[] {
  return list.map((token): TokenInfo => {
    if (isBaseToken(token)) {
      return token
    }

    const newT = structuredClone(token)
    for (const t of newT.groupedTokens) {
      const mergedTags = Array.from(
        new Set([...(token.tags ?? []), ...(t.tags ?? [])])
      )
      if (mergedTags.length > 0) {
        t.tags = mergedTags
      }
    }
    return newT
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

const tokenMapCache = new WeakMap<TokenInfo[], Map<string, BaseTokenInfo>>()

function getTokenMap(tokenList: TokenInfo[]): Map<string, BaseTokenInfo> {
  const cached = tokenMapCache.get(tokenList)
  if (cached) return cached

  const map = new Map<string, BaseTokenInfo>()
  for (const token of tokenList) {
    if ("groupedTokens" in token) {
      for (const t of token.groupedTokens) {
        map.set(t.defuseAssetId, t)
      }
    } else {
      map.set(token.defuseAssetId, token)
    }
  }
  tokenMapCache.set(tokenList, map)
  return map
}

export function findTokenByAssetId(
  tokenList: TokenInfo[],
  tokenId: string
): BaseTokenInfo | undefined {
  return getTokenMap(tokenList).get(tokenId)
}
