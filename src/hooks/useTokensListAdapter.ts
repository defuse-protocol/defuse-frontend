export const getChainIconFromId = (defuseAssetId: string): string => {
  const getAssetIdParts = defuseAssetId.split(":")
  const chain = getAssetIdParts.length ? getAssetIdParts[0] : ""
  switch (chain.toLowerCase()) {
    case "near":
      return "/static/icons/network/near.svg"
    case "base":
      return "/static/icons/network/base.svg"
    case "eth":
      return "/static/icons/network/ethereum.svg"
    case "btc":
      return "/static/icons/network/btc.svg"
    case "sol":
      return "/static/icons/wallets/solana-wallet.svg"
    default:
      return ""
  }
}
