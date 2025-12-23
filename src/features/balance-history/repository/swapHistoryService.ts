import type {
  SwapTransaction,
  TokenAmount,
} from "@src/features/balance-history/types"

import type { SwapRecord } from "./swapHistoryRepository"

/**
 * Well-known token address to symbol mappings.
 */
const TOKEN_SYMBOLS: Record<string, string> = {
  // Ethereum tokens
  "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48": "USDC",
  "0xdac17f958d2ee523a2206206994597c13d831ec7": "USDT",
  "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2": "WETH",
  "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599": "WBTC",
  "0x6b175474e89094c44da98b954eedeac495271d0f": "DAI",
  // NEAR tokens
  "17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1": "USDC",
}

interface ParsedAsset {
  symbol: string
  blockchain: string
  tokenId: string
}

/**
 * Parses an asset identifier string into structured token information.
 *
 * IMPORTANT: The `blockchain` field represents where the token currently lives,
 * NOT where it originally came from. All nep141/nep245 tokens live on NEAR.
 * The original chain (for bridged tokens) is shown via the chain icon overlay.
 */
function parseAsset(asset: string): ParsedAsset {
  if (!asset) {
    return { symbol: "UNKNOWN", blockchain: "unknown", tokenId: "" }
  }

  // All nep141 tokens live on NEAR blockchain
  if (asset.startsWith("nep141:")) {
    const tokenPart = asset.slice(7)

    // Bridged token pattern with address: "chain-address.omft.near" (e.g., eth-0x123.omft.near)
    const bridgedMatch = tokenPart.match(/^([a-z]+)-([^.]+)\.omft\.near$/)
    if (bridgedMatch) {
      const [, , address] = bridgedMatch
      const symbol =
        TOKEN_SYMBOLS[address.toLowerCase()] ??
        extractSymbolFromContract(tokenPart)
      return { symbol, blockchain: "near", tokenId: asset }
    }

    // Simple bridged token pattern: "chain.omft.near" (e.g., zec.omft.near, sol.omft.near)
    const simpleOmftMatch = tokenPart.match(/^([a-z]+)\.omft\.near$/)
    if (simpleOmftMatch) {
      const [, chain] = simpleOmftMatch
      return {
        symbol: chain.toUpperCase(),
        blockchain: "near",
        tokenId: asset,
      }
    }

    // Native NEAR token - extract symbol from contract name
    const symbol =
      TOKEN_SYMBOLS[tokenPart.toLowerCase()] ??
      extractSymbolFromContract(tokenPart)
    return { symbol, blockchain: "near", tokenId: asset }
  }

  // All nep245 tokens live on NEAR blockchain
  if (asset.startsWith("nep245:")) {
    return {
      symbol: extractSymbolFromContract(asset.slice(7)),
      blockchain: "near",
      tokenId: asset,
    }
  }

  return {
    symbol: extractSymbolFromContract(asset),
    blockchain: "unknown",
    tokenId: asset,
  }
}

/**
 * Extracts a readable symbol from a contract address.
 * E.g., "token.sweat" -> "SWEAT", "wrap.near" -> "NEAR"
 */
function extractSymbolFromContract(contract: string): string {
  // Common mappings
  const knownContracts: Record<string, string> = {
    "wrap.near": "wNEAR",
    "token.sweat": "SWEAT",
    "usdt.tether-token.near": "USDT",
    "sol.omft.near": "SOL",
    "mpdao-token.near": "MPDAO",
  }

  // Check for exact match first
  const lowerContract = contract.toLowerCase()
  for (const [key, symbol] of Object.entries(knownContracts)) {
    if (lowerContract.includes(key)) {
      return symbol
    }
  }

  // Extract first part before dots and clean it up
  const firstPart = contract.split(".")[0].split(":").pop() ?? contract

  // Remove common suffixes/prefixes
  const cleaned = firstPart
    .replace(/[-_]token$/i, "")
    .replace(/^token[-_]/i, "")
    .replace(/[-_]/g, "")

  return cleaned.toUpperCase().slice(0, 8)
}

/**
 * Extracts the first transaction hash from a JSON array string.
 */
function extractTxHash(
  nearTxHashes: string | null,
  intentHashes: string | null
): string {
  if (nearTxHashes) {
    // It might be comma-separated or JSON
    if (nearTxHashes.startsWith("[")) {
      try {
        const parsed = JSON.parse(nearTxHashes)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return String(parsed[0])
        }
      } catch {
        // Not JSON, try comma-separated
      }
    }
    // Comma-separated format
    const first = nearTxHashes.split(",")[0]
    if (first) return first.trim()
  }
  return intentHashes ?? ""
}

/**
 * Normalizes status to our supported types.
 */
function normalizeStatus(status: string): SwapTransaction["status"] {
  const upperStatus = status.toUpperCase()
  if (upperStatus === "SUCCESS") return "SUCCESS"
  if (upperStatus === "PROCESSING") return "PROCESSING"
  if (upperStatus === "PENDING_DEPOSIT") return "PENDING"
  if (upperStatus === "REFUNDED") return "FAILED"
  if (upperStatus.includes("PENDING")) return "PENDING"
  if (upperStatus.includes("FAIL") || upperStatus.includes("ERROR"))
    return "FAILED"
  return "PENDING"
}

/**
 * Transforms a database swap record into a SwapTransaction.
 */
export function transformSwapRecord(swap: SwapRecord): SwapTransaction {
  const txHash = extractTxHash(swap.nearTxHashes, swap.intentHashes)
  const fromAsset = parseAsset(swap.originAsset)
  const toAsset = parseAsset(swap.destinationAsset)

  const from: TokenAmount = {
    token_id: fromAsset.tokenId,
    symbol: fromAsset.symbol,
    blockchain: fromAsset.blockchain,
    amount: swap.amountInFormatted,
    amount_usd: swap.amountInUsd,
  }

  const to: TokenAmount = {
    token_id: toAsset.tokenId,
    symbol: toAsset.symbol,
    blockchain: toAsset.blockchain,
    amount: swap.amountOutFormatted,
    amount_usd: swap.amountOutUsd,
  }

  return {
    id: String(swap.id),
    timestamp: swap.createdAt,
    status: normalizeStatus(swap.status),
    from,
    to,
    transaction_hash: txHash,
  }
}
