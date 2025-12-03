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
  | "litecoin"
  | "layerx"
  | "monad"
  | VirtualChains
  | MockedChains

export type VirtualChains =
  | "turbochain"
  | "tuxappchain"
  | "vertex"
  | "optima"
  | "easychain"
  | "hako"
  | "aurora"
  | "aurora_devnet"

export type MockedChains = "hyperliquid"

export type SupportedBridge =
  | "direct"
  | "poa"
  | "aurora_engine"
  | "hot_omni"
  | "near_omni"

/**
 * @see BaseTokenInfo.deployments
 */
export type TokenDeployment = FungibleTokenInfo | NativeTokenInfo

/**
 * Context: NEAR Intents is a multi-token contract. Each token on the NEAR
 * blockchain is represented by a unique token ID string in the format:
 * `nep141:<token-id>`, where `<token-id>` is the contract ID on NEAR.
 *
 * Example: `wrap.near` → `nep141:wrap.near` inside Intents.
 *
 * Each instance represents one token recognized by NEAR Intents.
 */
export interface BaseTokenInfo {
  /**
   * Standardized token identifier used by NEAR Intents.
   *
   * Format: <standard>:<contract_id>[:<token_id>]
   * Standards:
   *   - nep141: Fungible Token Standard on NEAR
   *   - nep245: Multi Token Standard
   * @example
   *  - `nep141:usdt.tether-token.near`
   *  - `nep245:v2_1.omni.hot.tg:1117_`
   */
  defuseAssetId: string
  /** Symbol of the corresponding token on NEAR. */
  symbol: string
  /** Name of the corresponding token on NEAR. */
  name: string
  /** Number of decimals of the corresponding token on NEAR */
  decimals: number
  /** Icon of the corresponding token on NEAR */
  icon: string
  /**
   * Origin of the token. Most tokens are bridged from other chains,
   * but some are canonical to NEAR (e.g., wNEAR, usdt.tether-token.near).
   *
   * Used mainly for displaying a chain icon for the token.
   * SHOULD NOT be used for domain logic.
   */
  originChainName: SupportedChainName
  /**
   * Mappings to the token's deployments across chains.
   * Most tokens have a single deployment; some map to several.
   *
   * ```text
   * BaseTokenInfo (logical token in Intents)
   *   defuseAssetId: "nep141:tokenx.near"
   *           │
   *           │ one-to-one
   *           ▼
   * NEAR token contract (NEP-141)
   *   contractId: tokenx.near
   *           │
   *           │ one-to-many  (deployments)
   *           ▼
   * Deployments[]
   *   - NEAR (NEP-141):     tokenx.near
   *   - Solana (SPL):       abc
   *   - Ethereum (ERC-20):  0xbeef
   ** ```
   *
   * @remarks
   * Common multi-deployment cases:
   *   1. A PoA bridged token that is also used by NEAR ecosystem outside Intents.
   *   2. A token originally deployed on NEAR and bridged via Omni Bridge to other chains.
   *   3. Native USDC on NEAR bridged to app/virtual chains (e.g., Aurora, Turbo). After
   *      transferring back to NEAR, it becomes NEAR-native USDC and shares the same `defuseAssetId`.
   *
   * Non-empty tuple: at least one deployment is required.
   */
  deployments: [TokenDeployment, ...TokenDeployment[]]
  /**
   * Tags are arbitrary strings that can be used to categorize tokens.
   * Common patterns:
   *   - "aid:<family-id>" - Groups related tokens into families
   *   - "mc:<rank>" - Orders by MarketCap ranking (lower = higher cap)
   *   - "type:stablecoin" - No app fee for swaps between stables
   *
   *  @example ["aid:usdc", "mc:25", "type:stablecoin"]
   */
  tags?: string[]
}

export interface FungibleTokenInfo {
  address: string
  decimals: number
  chainName: SupportedChainName
  bridge: SupportedBridge
  // In Stellar, a token identified by `issuer` and `code`.
  // It's similar to multi-token contracts on other chains.
  // `stellarCode` is a temporary solution, the interface will be migrated to 1cs asset object format. (probably?)
  // https://github.com/defuse-protocol/sdk-monorepo/tree/main/packages/crosschain-assetid#object-form
  stellarCode?: string
}

export interface NativeTokenInfo {
  type: "native"
  decimals: number
  chainName: SupportedChainName
  bridge: SupportedBridge
}

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

/**
 * Used for generating JSON schema for a token list.
 */
export interface TokenList {
  $schema?: string
  tokens: TokenInfo[]
}

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
