export type SupportedChainName =
  | "eth"
  | "near"
  | "base"
  | "arbitrum"
  | "bitcoin"
  | "solana"
  | "dogecoin"
  | "xrpledger"
  | "zcash"
  | "gnosis"
  | "berachain"
  | "tron"
  | "polygon"
  | "bsc"
  | "ton"
  | "optimism"
  | "avalanche"
  | "sui"
  | "stellar"
  | "aptos"
  | "cardano"
  | VirtualChains
  | MockedChains

export type VirtualChains =
  | "turbochain"
  | "tuxappchain"
  | "vertex"
  | "optima"
  | "easychain"
  | "aurora"
  | "aurora_devnet"

export type MockedChains = "hyperliquid"

export type SupportedBridge =
  | "direct"
  | "poa"
  | "aurora_engine"
  | "hot_omni"
  | "near_omni"

export interface FungibleTokenInfo {
  defuseAssetId: string
  address: string
  symbol: string
  name: string
  decimals: number
  chainDecimals: number
  icon: string
  chainName: SupportedChainName
  bridge: SupportedBridge
}

export interface NativeTokenInfo {
  defuseAssetId: string
  type: "native"
  symbol: string
  name: string
  decimals: number
  chainDecimals: number
  icon: string
  chainName: SupportedChainName
  bridge: SupportedBridge
}

export type BaseTokenInfo = FungibleTokenInfo | NativeTokenInfo

/**
 * A virtual aggregation of the same token across multiple blockchains.
 * This is not an on-chain token but a unified view of network-specific tokens
 * with shared properties.
 *
 * The name avoids "NativeMultichainAsset" to clarify that it doesn't represent
 * an actual multichain token, just a virtual abstraction.
 */
export interface UnifiedTokenInfo {
  unifiedAssetId: string
  symbol: string
  name: string
  icon: string
  groupedTokens: BaseTokenInfo[]
}

export interface TokenValue {
  amount: bigint
  decimals: number
}
