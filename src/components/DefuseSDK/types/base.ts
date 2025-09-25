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
  icon: string
  chainName: SupportedChainName
  bridge: SupportedBridge
  tags?: string[]
}

export interface NativeTokenInfo {
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
  tags?: string[]
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
 * DID (Deployment Identifier Datum) represents a single token deployment on a specific chain.
 * Example:
 *   - ["near", "native"] - $NEAR on Near
 *   - ["eth", "0xdAC17F958D2ee523a2206206994597C13D831ec7"] - $USDT on Ethereum
 */
export type TokenDeploymentId = [SupportedChainName, string | "native"]

/**
 * Represents a group of tokens that share the same AID.
 */
export interface TokenFamily {
  aid: TokenAbstractId
  deployments: TokenDeploymentId[]
}
