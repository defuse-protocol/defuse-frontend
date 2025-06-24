import type { NextResponse } from "next/server"

import type { Result } from "./result"

export type BigNumber = string

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
 * Any optional auxiliary info not covered in the default schema and not required in most cases.
 */
export type Metadata = Record<string, string>

export interface Block {
  blockNumber: number
  /**
   * UNIX timestamp, not including milliseconds
   */
  blockTimestamp: number
  metadata?: Metadata
}

export type Event = { block: Block } & SwapEvent

export interface EventsResponse {
  events: Event[]
}

export interface LatestBlockResponse {
  block: Block
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

export interface PairResponse {
  pair: Pair
}

/**
 * Schema of all error responses
 */
export interface ErrorResponse {
  code: string
  message: string
  /**
   * Schema of error details
   */
  issues: {
    code?: string
    param?: string
    message: string
  }[]
}

export interface ErrorWithStatus {
  status: NonNullable<Parameters<(typeof NextResponse)["json"]>[1]>["status"]
  error: Omit<ErrorResponse, "issues"> & {
    issues?: ErrorResponse["issues"]
  }
}

export type ApiResult<T> = Promise<Result<T, ErrorWithStatus>>
