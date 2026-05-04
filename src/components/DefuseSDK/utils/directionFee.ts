const DIRECTION_FEE_ORIGIN_ASSETS = new Set([
  "nep141:wrap.near",
  "nep141:zec.omft.near",
  "nep141:starknet.omft.near",
])

export function computeDirectionFeeBps(
  directionFeeBps: number | null,
  originAsset: string,
  destinationChainName: string | undefined
): number {
  if (
    directionFeeBps != null &&
    directionFeeBps > 0 &&
    destinationChainName === "solana" &&
    DIRECTION_FEE_ORIGIN_ASSETS.has(originAsset)
  ) {
    return directionFeeBps
  }
  return 0
}
