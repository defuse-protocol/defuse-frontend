/**
 * Represents a large number that can be serialized as a string.
 */
type BigNumber = string

/**
 * Any optional auxiliary info not covered in the default schema and not required in most cases
 */
type Metadata = Record<string, string>

/**
 * Represents a block on the blockchain.
 */
export interface Block {
  blockNumber: number
  /**
   * UNIX timestamp, not including milliseconds
   */
  blockTimestamp: number
  metadata?: Metadata
}

/**
 * Represents a crypto asset.
 */
export interface Asset {
  /**
   * In most cases, asset ids will correspond to contract addresses. Ids are case-sensitive, and for EVM-compatible blockchains using checksummed addresses is highly encouraged
   */
  id: string
  name: string
  symbol: string
  decimals: number
  /**
   * Optional, but GeckoTerminal cannot calculate FDV/Market Cap if not available. Provide decimalized value (supply / (10 ** assetDecimals))
   */
  totalSupply?: BigNumber
  /**
   * Optional, but GeckoTerminal may not be able to show accurate market cap if not available. Provide decimalized value (supply / (10 ** assetDecimals))
   */
  circulatingSupply?: BigNumber
  /**
   * Optional, but may be used for displaying additional token information such as image, description and self-reported/off-chain circulating supply
   */
  coinGeckoId?: string
  metadata?: Metadata
}

/**
 * Represents a trading pair.
 */
export interface Pair {
  /**
   * In most cases, pair ids will correspond to contract addresses. Ids are case-sensitive, and for EVM-compatible blockchains using checksummed addresses is highly encouraged.
   */
  id: string
  /**
   * An identifier for the DEX that hosts this pair. For most cases this will be a static value such as uniswap, but if multiple DEXes are tracked an id such as a factory address may be used.
   */
  dexKey: string
  asset0Id: string
  asset1Id: string
  createdAtBlockNumber?: number
  createdAtBlockTimestamp?: number
  createdAtTxnId?: string
  creator?: string
  /**
   * Swap fees in bps. For instance, a fee of 1% maps to feeBps=100
   */
  feeBps?: number
  /**
   * Recommended for DEXes that support multi-asset pools and allows the GeckoTerminal UI to correlate multiple pairs in the same multi-asset pool
   */
  pool?: {
    id: string
    name: string
    assetIds: string[]
    pairIds: string[]
    metadata?: Metadata
  }
  metadata?: Metadata
}

/**
 * Represents a swap event.
 */
export interface SwapEvent {
  eventType: "swap"
  /**
   * A transaction identifier such as a transaction hash
   */
  txnId: string
  /**
   * The order of a transaction within a block; the higher the index, the later in the block the transaction was processed
   */
  txnIndex: number
  /**
   * The order of the event within a transaction; the higher the index, the later in the transaction the event was processed
   */
  eventIndex: number
  /**
   * An identifier for the account responsible for submitting the transaction
   */
  maker: string
  pairId: string
  asset0In?: BigNumber
  asset1In?: BigNumber
  asset0Out?: BigNumber
  asset1Out?: BigNumber
  /**
   * The price of asset0 quoted in asset1 in that event
   */
  priceNative: BigNumber
  /**
   * The pooled amount of each asset after a swap event has occurred
   */
  reserves: {
    asset0: BigNumber
    asset1: BigNumber
  }
  metadata?: Metadata
}

/**
 * Represents a join or exit event (add/remove liquidity).
 */
export interface JoinExitEvent {
  eventType: "join" | "exit"
  /**
   * A transaction identifier such as a transaction hash
   */
  txnId: string
  /**
   * The order of a transaction within a block; the higher the index, the later in the block the transaction was processed
   */
  txnIndex: number
  /**
   * The order of the event within a transaction; the higher the index, the later in the transaction the event was processed
   */
  eventIndex: number
  /**
   * An identifier for the account responsible for submitting the transaction
   */
  maker: string
  pairId: string
  amount0: BigNumber
  amount1: BigNumber
  /**
   * The pooled amount of each asset after a join/exit event has occurred
   */
  reserves: {
    asset0: BigNumber
    asset1: BigNumber
  }
  metadata?: Metadata
}

/**
 * Represents a single event, which can be a swap, join, or exit.
 */
export type Event = { block: Block } & (SwapEvent | JoinExitEvent)

export interface LatestBlockResponse {
  block: Block
}

export interface AssetResponse {
  asset: Asset
}

export interface PairResponse {
  pair: Pair
}

export interface EventsResponse {
  events: Event[]
}
