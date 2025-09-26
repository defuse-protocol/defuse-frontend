import type {
  BaseTokenInfo,
  BaseTokenInfo_old,
  UnifiedTokenInfo,
  UnifiedTokenInfo_old,
} from "@src/components/DefuseSDK/types/base"

export function fromOldBaseTokenInfoToNew(t: BaseTokenInfo_old): BaseTokenInfo {
  return {
    defuseAssetId: t.defuseAssetId,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    icon: t.icon,
    chainName: t.chainName,
    tags: t.tags,
    deployments: [
      "address" in t
        ? {
            // fungible token
            address: t.address,
            decimals: t.decimals,
            chainName: t.chainName,
            bridge: t.bridge,
          }
        : {
            // native token
            type: "native",
            decimals: t.decimals,
            chainName: t.chainName,
            bridge: t.bridge,
          },
    ],
  }
}

export function fromOldListToNew(
  oldList: (BaseTokenInfo_old | UnifiedTokenInfo_old)[]
): (BaseTokenInfo | UnifiedTokenInfo)[] {
  const map = new Map<string, BaseTokenInfo>()
  const unifiedTokens: UnifiedTokenInfo[] = []

  for (const t of oldList) {
    if ("defuseAssetId" in t) {
      // BaseTokenInfo
      const newT = fromOldBaseTokenInfoToNew(t)
      if (!map.has(t.defuseAssetId)) {
        map.set(t.defuseAssetId, newT)
      } else {
        map.get(t.defuseAssetId)?.deployments.push(...newT.deployments)
      }
    } else {
      // UnifiedTokenInfo
      const tt: UnifiedTokenInfo = {
        unifiedAssetId: t.unifiedAssetId,
        symbol: t.symbol,
        name: t.name,
        icon: t.icon,
        tags: t.tags,
        groupedTokens: fromOldListToNew(t.groupedTokens) as BaseTokenInfo[],
      }
      unifiedTokens.push(tt)
    }
  }

  return [...unifiedTokens, ...map.values()]
}
