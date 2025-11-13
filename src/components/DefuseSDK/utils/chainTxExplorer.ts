import type { SupportedChainName } from "../types/base"

export function chainTxExplorer(blockchain: SupportedChainName): string | null {
  switch (blockchain) {
    case "near":
      return "https://nearblocks.io/txns/"
    case "eth":
      return "https://etherscan.io/tx/"
    case "base":
      return "https://basescan.org/tx/"
    case "arbitrum":
      return "https://arbiscan.io/tx/"
    case "turbochain":
      return "https://explorer.turbo.aurora.dev/tx/"
    case "bitcoin":
      return "https://blockchain.info/tx/"
    case "solana":
      return "https://orb.helius.dev/tx/"
    case "dogecoin":
      return "https://dogechain.info/tx/"
    case "aurora":
      return "https://explorer.aurora.dev/tx/"
    case "aurora_devnet":
      return "https://0x4e45426a.explorer.aurora-cloud.dev/tx/"
    case "xrpledger":
      return "https://livenet.xrpl.org/transactions/"
    case "zcash":
      return "https://3xpl.com/zcash/transaction/"
    case "gnosis":
      return "https://gnosisscan.io/tx/"
    case "berachain":
      return "https://berascan.com/tx/"
    case "tron":
      return "https://tronscan.org/#/transaction/"
    case "tuxappchain":
      return "https://explorer.tuxa.aurora.dev/tx/"
    case "vertex":
      return "https://explorer.0x4e454173.aurora-cloud.dev/tx/"
    case "optima":
      return "https://explorer.optima.aurora.dev/tx/"
    case "easychain":
      return "https://0x4e454218.explorer.aurora-cloud.dev/tx/"
    case "polygon":
      return "https://polygonscan.com/tx/"
    case "bsc":
      return "https://bscscan.com/tx/"
    case "hyperliquid":
      return "https://app.hyperliquid.xyz/explorer/tx/"
    case "ton":
      return "https://tonviewer.com/transaction/"
    case "optimism":
      return "https://optimistic.etherscan.io/tx/"
    case "avalanche":
      return "https://snowtrace.io/tx/"
    case "sui":
      return "https://suivision.xyz/txblock/"
    case "stellar":
      return "https://stellar.expert/explorer/public/tx/"
    case "aptos":
      return "https://explorer.aptoslabs.com/txn/"
    case "cardano":
      return "https://adastat.net/transactions/"
    case "litecoin":
      return "https://litecoinspace.org/tx/"
    case "layerx":
      return "https://layerxscan.io/tx/"
    default:
      blockchain satisfies never
      return null
  }
}

export function blockExplorerTxLinkFactory(
  blockchain: SupportedChainName,
  txHash: string
) {
  const baseUrl = chainTxExplorer(blockchain)
  if (baseUrl != null) {
    return baseUrl + txHash
  }
}
