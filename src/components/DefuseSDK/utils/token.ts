import type {
  BaseTokenInfo,
  FungibleTokenInfo,
  NativeTokenInfo,
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
