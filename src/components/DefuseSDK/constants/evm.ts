import type { SupportedChainName } from "../types/base"

/**
 * Chain IDs for EVM-compatible chains.
 * Non-EVM chains are `undefined`.
 */
export const CHAIN_IDS: Record<SupportedChainName, number | undefined> = {
  eth: 1,
  near: undefined,
  base: 8453,
  arbitrum: 42161,
  bitcoin: undefined,
  solana: undefined,
  dogecoin: undefined,
  turbochain: 1313161567,
  tuxappchain: 1313161573,
  vertex: 1313161587,
  optima: 1313161569,
  easychain: 1313161752,
  aurora: 1313161554,
  aurora_devnet: 1313161834,
  xrpledger: undefined,
  zcash: undefined,
  gnosis: 100,
  berachain: 80094,
  tron: undefined,
  polygon: 137,
  bsc: 56,
  hyperliquid: undefined,
  ton: undefined,
  optimism: 10,
  avalanche: 43114,
  sui: undefined,
  stellar: undefined,
  aptos: undefined,
  cardano: undefined,
  litecoin: undefined,
  layerx: 196,
}
