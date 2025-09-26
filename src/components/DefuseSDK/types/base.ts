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

export type TokenDeployment = FungibleTokenInfo | NativeTokenInfo

export interface BaseTokenInfo {
  defuseAssetId: string
  symbol: string
  name: string
  decimals: number
  icon: string
  /**
   * Origin of the token. Most tokens are bridged from other chains.
   * But some are canonical to NEAR, like wNEAR or usdt.tether-token.near.
   * It's mostly used for showing a chain icon for the token.
   * @deprecated
   */
  chainName: SupportedChainName
  deployments: [TokenDeployment, ...TokenDeployment[]]
  tags?: string[]
}

/**
 * @deprecated
 */
export interface FungibleTokenInfo_old {
  defuseAssetId: string
  address: string
  symbol: string
  name: string
  decimals: number
  icon: string
  chainName: SupportedChainName
  bridge: SupportedBridge
  tags?: string[]
}

export interface FungibleTokenInfo {
  address: string
  decimals: number
  chainName: SupportedChainName
  stellarCode?: string
  bridge: SupportedBridge
}

/**
 * @deprecated
 */
export interface NativeTokenInfo_old {
  defuseAssetId: string
  type: "native"
  symbol: string
  name: string
  decimals: number
  icon: string
  chainName: SupportedChainName
  bridge: SupportedBridge
  tags?: string[]
}

export interface NativeTokenInfo {
  type: "native"
  decimals: number
  chainName: SupportedChainName
  bridge: SupportedBridge
}

/**
 * @deprecated
 */
export type BaseTokenInfo_old = FungibleTokenInfo_old | NativeTokenInfo_old

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
  tags?: string[]
}

/**
 * @deprecated
 */
export type UnifiedTokenInfo_old = Omit<UnifiedTokenInfo, "groupedTokens"> & {
  groupedTokens: BaseTokenInfo_old[]
}

export type TokenInfo = BaseTokenInfo | UnifiedTokenInfo

export interface TokenValue {
  amount: bigint
  decimals: number
}

/**
 * AID (Abstract Identifier Datum) is a brand/class across chains.
 * One AID maps to many token deployments (native + wrapped + bridged).
 * If a token is not a part of related assets, it might not have an AID.
 * Examples: "usdc", "eth".
 */
export type TokenAbstractId = string

/**
 * Represents a group of tokens that share the same AID.
 */
export interface TokenFamily {
  aid: TokenAbstractId
  tokenIds: BaseTokenInfo["defuseAssetId"][]
}
