import type {
  SwapTransaction,
  TransactionType,
} from "@src/features/balance-history/types"
import type { IntentsExplorerTransaction } from "./intentsExplorerAPI"

function normalizeStatus(
  status: IntentsExplorerTransaction["status"]
): SwapTransaction["status"] {
  switch (status) {
    case "SUCCESS":
      return "SUCCESS"
    case "PROCESSING":
      return "PROCESSING"
    case "PENDING_DEPOSIT":
    case "INCOMPLETE_DEPOSIT":
      return "PENDING"
    case "FAILED":
    case "REFUNDED":
      return "FAILED"
    default:
      return "PENDING"
  }
}

function extractChainFromAssetId(assetId: string): string {
  const colonIndex = assetId.indexOf(":")
  if (colonIndex === -1) return "unknown"
  return assetId.substring(0, colonIndex).toLowerCase()
}

function isNearChain(chain: string): boolean {
  return chain === "near" || chain === "nep141"
}

/**
 * Detects transaction type based on amounts and asset chain prefixes.
 *
 * Primary rule: If both input and output have amounts, it's a SWAP.
 * This handles cross-chain swaps (e.g., DOGE → XLM) that go through NEAR internally.
 *
 * Fallback rules for single-sided transactions:
 * - Deposit: External chain asset → NEAR asset
 * - Withdrawal: NEAR asset → External chain asset
 */
function detectTransactionType(
  originAsset: string,
  destinationAsset: string,
  amountIn: string,
  amountOut: string
): TransactionType {
  const hasAmountIn = amountIn && amountIn !== "0" && amountIn !== ""
  const hasAmountOut = amountOut && amountOut !== "0" && amountOut !== ""

  // If both sides have amounts, it's a swap (regardless of chains)
  if (hasAmountIn && hasAmountOut) {
    return "swap"
  }

  // Single-sided transactions: use chain detection
  const originChain = extractChainFromAssetId(originAsset)
  const destChain = extractChainFromAssetId(destinationAsset)
  const originIsNear = isNearChain(originChain)
  const destIsNear = isNearChain(destChain)

  // External → NEAR = Deposit
  if (!originIsNear && destIsNear) {
    return "deposit"
  }

  // NEAR → External = Withdrawal
  if (originIsNear && !destIsNear) {
    return "withdrawal"
  }

  // Default to swap
  return "swap"
}

export function transformTransaction(
  tx: IntentsExplorerTransaction
): SwapTransaction {
  const originChain = extractChainFromAssetId(tx.originAsset)
  const destChain = extractChainFromAssetId(tx.destinationAsset)

  return {
    id: tx.depositAddress,
    type: detectTransactionType(
      tx.originAsset,
      tx.destinationAsset,
      tx.amountInFormatted,
      tx.amountOutFormatted
    ),
    timestamp: tx.createdAt,
    status: normalizeStatus(tx.status),
    from: {
      token_id: tx.originAsset,
      symbol: "",
      blockchain: isNearChain(originChain) ? "near" : originChain,
      amount: tx.amountInFormatted,
      amount_usd: tx.amountInUsd,
    },
    to: {
      token_id: tx.destinationAsset,
      symbol: "",
      blockchain: isNearChain(destChain) ? "near" : destChain,
      amount: tx.amountOutFormatted,
      amount_usd: tx.amountOutUsd,
    },
    transaction_hash: tx.intentHashes ?? "",
    deposit_address: tx.depositAddress,
  }
}
