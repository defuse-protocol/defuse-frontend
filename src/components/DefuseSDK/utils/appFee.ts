import type {
  BaseTokenInfo,
  UnifiedTokenInfo,
} from "@src/components/DefuseSDK/types/base"

export function computeAppFeeBps(
  defaultAppFeeBps: number,
  token1: BaseTokenInfo | UnifiedTokenInfo,
  token2: BaseTokenInfo | UnifiedTokenInfo
) {
  if (
    hasTags(token1) &&
    hasTags(token2) &&
    token1.tags.includes("type:stablecoin") &&
    token2.tags.includes("type:stablecoin")
  ) {
    return 0
  }
  return defaultAppFeeBps
}

function hasTags(a: object): a is { tags: string[] } {
  if ("tags" in a) {
    return true
  }
  return false
}
