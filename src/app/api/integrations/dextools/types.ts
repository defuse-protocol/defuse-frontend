/**
 * ------------------------------
 * DEXTools Integration Types
 * ------------------------------
 *
 * These interfaces are derived from the public specification provided in
 * `spec.yaml` and the accompanying documentation in `README.md`.
 * Whenever there is a discrepancy, the OpenAPI spec takes precedence.
 */

import type { BigNumber } from "@src/app/api/integrations/shared/types"

/**
 * Block schema
 */
export interface Block {
  /**
   * Number of the block
   */
  blockNumber: number
  /**
   * Timestamp (in seconds) the block was confirmed at
   */
  blockTimestamp: number
}

/**
 * Token schema
 */
export interface Asset {
  /**
   * Address of the token
   */
  id: string
  /**
   * Name of the token
   */
  name?: string
  /**
   * Symbol of the token
   */
  symbol?: string
  /**
   * Total supply of the token at current time
   */
  totalSupply?: BigNumber
  /**
   * Circulating supply of the token at current time
   */
  circulatingSupply?: BigNumber
  /**
   * Total number of holders of the token
   */
  holdersCount?: number
}

/**
 * Holder of tokens schema
 */
export interface AssetHolder {
  /**
   * Address of the holder
   */
  address: string
  /**
   * Number of tokens held by this address
   */
  quantity: BigNumber
}

/**
 * List of token holders schema
 */
export interface AssetHolders {
  /**
   * Address of the token
   */
  id: string
  /**
   * Total number of holders owning the requested token
   */
  totalHoldersCount: number
  /**
   * List of holders owning the token, sorted in descending order of importance.
   */
  holders: AssetHolder[]
}

/**
 * Pair schema
 */
export interface Pair {
  /**
   * Address of the pair
   */
  id: string
  /**
   * Address of the first token of the pair
   */
  asset0Id: string
  /**
   * Address of the second token of the pair
   */
  asset1Id: string
  /**
   * Number of block the pair was created at
   */
  createdAtBlockNumber: number
  /**
   * Timestamp (in seconds) of the block the pair was created at
   */
  createdAtBlockTimestamp: number
  /**
   * Hash of the transaction the pair was created at
   */
  createdAtTxnId: string
  /**
   * Address of the smart contract used to create the pair
   */
  factoryAddress: string
}

/**
 * Exchange schema
 */
export interface Exchange {
  /**
   * Address of the factory contract
   */
  factoryAddress: string
  /**
   * Name of the exchange
   */
  name: string
  /**
   * URL of exchange Logo
   */
  logoURL?: string
}

/**
 * Base properties for all event types.
 */
interface BaseEvent {
  /**
   * Block schema
   */
  block: Block
  /**
   * Hash of the transaction the event belongs to
   */
  txnId: string
  /**
   * Index of the transaction the event belongs to
   */
  txnIndex: number
  /**
   * Index of the event inside the block. This will be used to sort events and must be unique for all events inside a block.
   */
  eventIndex: number
  /**
   * Address of the wallet who request the transaction
   */
  maker: string
  /**
   * Address of the pair involved in the transaction
   */
  pairId: string
  /**
   * Type of event (creation -> Pair created; swap -> Swap; join -> Add liquidity; exit -> Remove liquidity)
   */
  eventType: "creation" | "swap" | "join" | "exit"
}

/**
 * Reserves of each token remaining after an event has been executed.
 * Applies to swaps, joins, and exits.
 */
interface Reserves {
  reserves: {
    /**
     * Reserves of token asset0
     */
    asset0: BigNumber
    /**
     * Reserves of token asset1
     */
    asset1: BigNumber
  }
}

/**
 * Event schema for a swap.
 */
export interface SwapEvent extends BaseEvent, Reserves {
  eventType: "swap"
  /**
   * Only for swaps: Number of tokens of asset0 sold
   */
  asset0In?: BigNumber
  /**
   * Only for swaps: Number of tokens of asset1 sold
   */
  asset1In?: BigNumber
  /**
   * Only for swaps: Number of tokens of asset0 bought
   */
  asset0Out?: BigNumber
  /**
   * Only for swaps: Number of tokens of asset1 bought
   */
  asset1Out?: BigNumber
}

/**
 * Event schema for adding liquidity.
 */
export interface JoinEvent extends BaseEvent, Reserves {
  eventType: "join"
  /**
   * Only for joins and exits: Number of tokens of asset0 added to the pool
   */
  amount0: BigNumber
  /**
   * Only for joins and exits: Number of tokens of asset1 added to the pool
   */
  amount1: BigNumber
}

/**
 * Event schema for removing liquidity.
 */
export interface ExitEvent extends BaseEvent, Reserves {
  eventType: "exit"
  /**
   * Only for joins and exits: Number of tokens of asset0 added to the pool
   */
  amount0: BigNumber
  /**
   * Only for joins and exits: Number of tokens of asset1 added to the pool
   */
  amount1: BigNumber
}

/**
 * Event schema for pair creation.
 */
export interface CreationEvent extends BaseEvent {
  eventType: "creation"
}

/**
 * Represents a single event, which can be a swap, join, exit, or creation.
 */
export type Event = SwapEvent | JoinEvent | ExitEvent | CreationEvent

/* ---------- Response wrappers ---------- */

/**
 * Response of the endpoints that return a single block
 */
export interface BlockResponse {
  block: Block
}

/**
 * Response of the endpoints that return a single token
 */
export interface AssetResponse {
  asset: Asset
}

/**
 * Response of the endpoint that return a list of holders of a token
 */
export interface AssetHoldersResponse {
  asset: AssetHolders
}

/**
 * Response of the endpoints that return a single exchange
 */
export interface ExchangeResponse {
  exchange: Exchange
}

/**
 * Response of the endpoints that return a single pair
 */
export interface PairResponse {
  pair: Pair
}

/**
 * Response of the /events endpoint
 */
export interface EventsResponse {
  events: Event[]
}
