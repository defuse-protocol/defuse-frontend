import { BlockchainEnum } from "@defuse-protocol/internal-utils"
import type { SupportedChainName } from "../types/base"

export const assetNetworkAdapter: Record<SupportedChainName, BlockchainEnum> = {
  near: BlockchainEnum.NEAR,
  eth: BlockchainEnum.ETHEREUM,
  base: BlockchainEnum.BASE,
  arbitrum: BlockchainEnum.ARBITRUM,
  bitcoin: BlockchainEnum.BITCOIN,
  solana: BlockchainEnum.SOLANA,
  dogecoin: BlockchainEnum.DOGECOIN,
  turbochain: BlockchainEnum.TURBOCHAIN,
  aurora: BlockchainEnum.AURORA,
  aurora_devnet: BlockchainEnum.AURORA_DEVNET,
  xrpledger: BlockchainEnum.XRPLEDGER,
  zcash: BlockchainEnum.ZCASH,
  gnosis: BlockchainEnum.GNOSIS,
  berachain: BlockchainEnum.BERACHAIN,
  tron: BlockchainEnum.TRON,
  tuxappchain: BlockchainEnum.TUXAPPCHAIN,
  vertex: BlockchainEnum.VERTEX,
  optima: BlockchainEnum.OPTIMA,
  easychain: BlockchainEnum.EASYCHAIN,
  polygon: BlockchainEnum.POLYGON,
  bsc: BlockchainEnum.BSC,
  hyperliquid: BlockchainEnum.HYPERLIQUID,
  ton: BlockchainEnum.TON,
  optimism: BlockchainEnum.OPTIMISM,
  avalanche: BlockchainEnum.AVALANCHE,
  sui: BlockchainEnum.SUI,
  stellar: BlockchainEnum.STELLAR,
  aptos: BlockchainEnum.APTOS,
  cardano: BlockchainEnum.CARDANO,
}

export const reverseAssetNetworkAdapter: Record<
  BlockchainEnum,
  SupportedChainName
> = {
  [BlockchainEnum.NEAR]: "near",
  [BlockchainEnum.ETHEREUM]: "eth",
  [BlockchainEnum.BASE]: "base",
  [BlockchainEnum.ARBITRUM]: "arbitrum",
  [BlockchainEnum.BITCOIN]: "bitcoin",
  [BlockchainEnum.SOLANA]: "solana",
  [BlockchainEnum.DOGECOIN]: "dogecoin",
  [BlockchainEnum.TURBOCHAIN]: "turbochain",
  [BlockchainEnum.AURORA]: "aurora",
  [BlockchainEnum.AURORA_DEVNET]: "aurora_devnet",
  [BlockchainEnum.XRPLEDGER]: "xrpledger",
  [BlockchainEnum.ZCASH]: "zcash",
  [BlockchainEnum.GNOSIS]: "gnosis",
  [BlockchainEnum.BERACHAIN]: "berachain",
  [BlockchainEnum.TRON]: "tron",
  [BlockchainEnum.TUXAPPCHAIN]: "tuxappchain",
  [BlockchainEnum.VERTEX]: "vertex",
  [BlockchainEnum.OPTIMA]: "optima",
  [BlockchainEnum.EASYCHAIN]: "easychain",
  [BlockchainEnum.POLYGON]: "polygon",
  [BlockchainEnum.BSC]: "bsc",
  [BlockchainEnum.HYPERLIQUID]: "hyperliquid",
  [BlockchainEnum.TON]: "ton",
  [BlockchainEnum.OPTIMISM]: "optimism",
  [BlockchainEnum.AVALANCHE]: "avalanche",
  [BlockchainEnum.SUI]: "sui",
  [BlockchainEnum.STELLAR]: "stellar",
  [BlockchainEnum.APTOS]: "aptos",
  [BlockchainEnum.CARDANO]: "cardano",
}

export function isValidBlockchainEnumKey(
  key: string
): key is keyof typeof reverseAssetNetworkAdapter {
  return key in reverseAssetNetworkAdapter
}
